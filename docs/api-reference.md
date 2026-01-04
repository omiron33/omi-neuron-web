# API Reference

Base path defaults to `/api/neuron`.

## Nodes
- `GET /nodes`
- `POST /nodes`
- `PATCH /nodes/:id`
- `DELETE /nodes/:id`

## Edges
- `GET /edges`
- `POST /edges`
- `PATCH /edges/:id`
- `DELETE /edges/:id`

## Graph
- `GET /graph`
- `POST /graph/expand`
- `POST /graph/path`

## Analysis
- `POST /analyze`
- `GET /analyze/:jobId`
- `POST /analyze/:jobId/cancel`
- `GET /analyze/history`

## Settings
- `GET /settings`
- `PATCH /settings`
- `POST /settings/reset`

## Search
- `POST /search`
- `POST /search/similar`
