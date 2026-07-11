# DNS-AID Records

The site is deployed through GitHub Pages for `classroom.anir0y.in`; this repository does not contain DNS provider infrastructure. Publish these records in the authoritative DNS zone for `anir0y.in` and enable DNSSEC for authenticated discovery responses.

```dns
_index._agents.classroom.anir0y.in. 3600 IN HTTPS 1 classroom.anir0y.in. alpn="h2,h3" key65300="/.well-known/api-catalog"
_mcp._agents.classroom.anir0y.in.   3600 IN HTTPS 1 classroom.anir0y.in. alpn="h2,h3" key65300="/.well-known/mcp/server-card.json"
_auth._agents.classroom.anir0y.in.  3600 IN HTTPS 1 classroom.anir0y.in. alpn="h2,h3" key65300="/.well-known/oauth-protected-resource"
```

`key65300` is an experimental private-use SvcParamKey placeholder for the discovery endpoint path until DNS-AID parameters are registered.
