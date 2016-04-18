package main

import (
	"encoding/base64"
	"encoding/json"
	"flag"
	"log"
	"net/http"

	"github.com/cockroachdb/cockroach/base"
	"github.com/cockroachdb/cockroach/client"
	"github.com/cockroachdb/cockroach/keys"
	"github.com/cockroachdb/cockroach/roachpb"
	"github.com/cockroachdb/cockroach/rpc"
	"github.com/cockroachdb/cockroach/util/stop"
)

var (
	flagAddr   = flag.String("listen", ":2015", "listen address")
	flagDev    = flag.Bool("dev", false, "enable dev mode")
	flagCRAddr = flag.String("cr", "localhost:26257", "cockroach address")

	db *client.DB
)

func main() {
	flag.Parse()

	rpcContext := rpc.NewContext(&base.Context{
		Insecure: true,
	}, nil, stop.NewStopper())
	sender, err := client.NewSender(rpcContext, *flagCRAddr)
	if err != nil {
		log.Fatal(err)
	}
	db = client.NewDB(sender)

	webFS := FS(*flagDev)
	http.Handle("/static/", http.FileServer(webFS))
	http.HandleFunc("/", Index)
	http.HandleFunc("/api/keys", wrap(Keys))
	http.HandleFunc("/api/values", wrap(Values))
	log.Fatal(http.ListenAndServe(*flagAddr, nil))
}

func Index(w http.ResponseWriter, r *http.Request) {
	w.Write(FSMustByte(*flagDev, "/static/index.html"))
}

func wrap(f func(r *http.Request) (interface{}, error)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		res, err := f(r)
		if err != nil {
			log.Println(err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if res == nil {
			return
		}
		w.Header().Add("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(res); err != nil {
			log.Println(err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func Keys(r *http.Request) (interface{}, error) {
	resp := struct {
		Keys map[string][]byte
	}{
		Keys: make(map[string][]byte),
	}
	var begin interface{} = keys.LocalMax
	const max = 1000
	for {
		kvs, err := db.ScanInconsistent(begin, keys.MaxKey, max)
		if err != nil {
			return nil, err.GoError()
		}
		for _, kv := range kvs {
			resp.Keys[kv.Key.String()] = []byte(kv.Key)
		}
		if len(kvs) < max {
			break
		}
		begin = kvs[len(kvs)-1].Key
	}
	return resp, nil
}

func Values(r *http.Request) (interface{}, error) {
	req := struct {
		Keys []string
	}{}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return nil, err
	}
	resp := struct {
		Values []string
	}{
		Values: make([]string, len(req.Keys)),
	}
	b := db.NewBatch()
	for _, k := range req.Keys {
		key, err := base64.StdEncoding.DecodeString(k)
		if err != nil {
			return nil, err
		}
		b.Get(key)
	}
	b.ReadConsistency = roachpb.INCONSISTENT
	err := db.Run(b)
	if err != nil {
		return nil, err.GoError()
	}
	for i, r := range b.Results {
		resp.Values[i] = r.Rows[0].PrettyValue()
	}
	return resp, nil
}

//go:generate browserify -t [ babelify --presets [ react ] ] static/src/site.js -o static/js/site.js
//go:generate esc -o static.go -pkg main static/index.html static/js
