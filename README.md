# ck

ck is a viewer for [CockroachDB](https://github.com/cockroachdb/cockroach) keys.
It can connect to an insecure node and display a web frontend for the KV layer.

## installation

`go get github.com/mjibson/ck`

## usage

Run `ck`, then open [http://localhost:2015](http://localhost:2015).

## development

1. Install JavaScript dependencies: `npm install`.
2. Install [modd](http://github.com/cortesi/modd): `go get github.com/cortesi/modd`.
3. Run `modd` in the `ck` directory. This will watch and recompile Go and JS as needed.

To regenerate the static assets in `static.go`:

1. Install [esc](github.com/mjibson/esc): `go get github.com/mjibson/esc`.
2. Run `go generate` to recompile the static assets.
