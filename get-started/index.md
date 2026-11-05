Source: https://vecturadb.org/get-started/

# Get started

Three ways to run VecturaDB: the Python package, the Docker image and the CLI.

## Python
    
    
    pip uninstall -y chromadb
    pip install VecturaDB
    

The `VecturaDB` package keeps the import name `chromadb`, so existing code runs as it is.
    
    
    import chromadb
    
    client = chromadb.HttpClient(host="localhost", port=8000)
    

While only previews exist, `pip install VecturaDB` installs the newest preview. Once `1.0.0` is out, install a preview with its exact version, for example `pip install VecturaDB==1.0.0rc4`: `--pre` takes the previews of the dependencies too, and a preview of httpx breaks the client.

### Packages that depend on chromadb

`VecturaDB` and `chromadb` install the same modules, so they cannot be installed side by side. Packages that declare a dependency on `chromadb`, such as `langchain-chroma`, make pip install `chromadb` too, and its files replace those of VecturaDB. Install those packages first and VecturaDB last:
    
    
    pip install langchain-chroma
    pip install --force-reinstall --no-deps VecturaDB
    

  * Run the last line again after any command that installs or upgrades `chromadb`.
  * Do not uninstall `chromadb` afterwards: it removes files that VecturaDB uses.

## Docker
    
    
    docker run -p 127.0.0.1:8000:8000 -v ./data:/data ghcr.io/vecturadb/vecturadb:preview
    

Images for amd64 and arm64. `preview` is the newest preview; every release also has a tag with its version. The data lives in `/data`.

## CLI

Linux (x86_64 and arm64) and macOS (x64 and arm64):
    
    
    curl -sSL https://raw.githubusercontent.com/VecturaDB/VecturaDB/main/rust/cli/install/install.sh | bash
    chroma run --path ./data
    

Windows (x64), in PowerShell:
    
    
    iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/VecturaDB/VecturaDB/main/rust/cli/install/install.ps1'))
    

The scripts install the newest release, previews included. Every binary is also in the [releases](https://github.com/VecturaDB/VecturaDB/releases). The binary keeps the name `chroma`.

## Moving data out of Chroma Cloud

Guides for every destination, Chroma included: [Leaving Chroma Cloud](https://vecturadb.org/leaving-chroma-cloud/).

The CLI copies collections from Chroma Cloud into a running VecturaDB:
    
    
    chroma login --api-key <your Chroma Cloud API key>
    chroma copy --from-cloud --to-local --host http://localhost:8000 --db <database> --all
    

To copy only some collections, use `--collections <name>` once per collection instead of `--all`. The collections must not exist yet in VecturaDB.

The copy stops at the first collection it cannot create. The collections copied before it stay in VecturaDB: copy the rest with `--collections`. Collections whose metadata holds the legacy `hnsw:*` settings fail with `Cannot set both collection config and schema simultaneously`; Chroma gives the same error.

What arrives: every record with its document, metadata, embedding and URI, the metadata of the collection, and its schema, sparse and BM25 indexes included. Sparse and BM25 searches give the same scores as on Chroma Cloud. The settings of the dense index do not arrive: Chroma Cloud uses SPANN, VecturaDB uses HNSW with its default settings.

## Telemetry

Off by default. `ANONYMIZED_TELEMETRY=TRUE` turns on the anonymized telemetry inherited from Chroma, in the Python package only. The server binary sends none.
