# Runs the evening digest's automation the way Home Assistant would, against made-up evenings, and prints what each phone was sent.
# A stand-in, not Home Assistant: it knows only the template functions the digest uses (digest.ts). The real thing is tried on the
# live system when the piece is deployed.
# In: JSON on stdin, { automation, scenarios: [{ name, now, states, responses }] }. Out: JSON, one { name, title, message, sent, error } each.
import ast, json, sys
from datetime import datetime, timedelta, timezone
from jinja2.sandbox import ImmutableSandboxedEnvironment

TZ = timezone(timedelta(hours=8))

def run(auto, sc):
    now = datetime.fromisoformat(sc['now']).astimezone(TZ)
    S = sc.get('states', {})
    env = ImmutableSandboxedEnvironment()
    def states(e): return S[e]['state'] if e in S else 'unknown'
    def state_attr(e, a): return (S.get(e, {}).get('attributes') or {}).get(a)
    def has_value(e): return e in S and S[e]['state'] not in ('unknown', 'unavailable')
    def today_at(t='00:00'):
        h, m = [int(x) for x in t.split(':')[:2]]
        return now.replace(hour=h, minute=m, second=0, microsecond=0)
    def as_datetime(v):
        if isinstance(v, datetime): return v
        return datetime.fromisoformat(str(v))
    def as_local(d): return d.astimezone(TZ) if d.tzinfo else d.replace(tzinfo=TZ)
    def timestamp_custom(v, fmt='%Y-%m-%d %H:%M:%S', local=True, default=None):
        try: return datetime.fromtimestamp(float(v), TZ if local else timezone.utc).strftime(fmt)
        except Exception: return v if default is None else default
    def to_float(v, default=0.0):
        try: return float(v)
        except Exception: return default
    def to_int(v, default=0):
        try: return int(float(v))
        except Exception: return default
    env.globals.update(now=lambda: now, today_at=today_at, timedelta=timedelta, states=states, state_attr=state_attr, has_value=has_value,
                       as_datetime=as_datetime, strptime=lambda s, f: datetime.strptime(s, f))
    env.filters.update(as_local=as_local, timestamp_custom=timestamp_custom, from_json=lambda s: json.loads(s), float=to_float, int=to_int, as_datetime=as_datetime)
    def render(t, v):
        if not isinstance(t, str) or '{' not in t: return t
        out = env.from_string(t).render(**v)
        # Home Assistant turns a result that reads as a number, list or map into one
        try:
            lit = ast.literal_eval(out)
            if not isinstance(lit, str): return lit
        except Exception: pass
        return out
    def deep(x, v): return {k: deep(y, v) for k, y in x.items()} if isinstance(x, dict) else [deep(y, v) for y in x] if isinstance(x, list) else render(x, v)
    v, sent, asked = {}, [], []
    for a in auto['actions']:
        if 'variables' in a:
            v.update({k: render(t, v) for k, t in a['variables'].items()})
        elif 'response_variable' in a:
            asked.append({'action': a['action'], 'target': a.get('target'), 'data': deep(a.get('data', {}), v)})
            r = (sc.get('responses') or {}).get(a['response_variable'])
            if r is not None: v[a['response_variable']] = r
            elif not a.get('continue_on_error'): raise RuntimeError('a failed call would stop the automation: ' + a['action'])
        else:
            sent.append({'to': a['action'], **deep(a.get('data', {}), v)})
    return {'name': sc['name'], 'title': v.get('title'), 'message': v.get('message'), 'sent': sent, 'asked': asked}

job = json.load(sys.stdin)
out = []
for sc in job['scenarios']:
    try: out.append(run(sc.get('automation') or job['automation'], sc))
    except Exception as e: out.append({'name': sc['name'], 'error': f'{type(e).__name__}: {e}'})
print(json.dumps(out))
