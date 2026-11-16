Source: https://vecturadb.org/get-started/

# Get started

Four ways to run VecturaDB: the Python package, the Docker image, the CLI and the npm package.

## Python
    
    
    pip uninstall -y chromadb
    pip install VecturaDB
    

The `VecturaDB` package keeps the import name `chromadb`, so existing code runs as it is.
    
    
    import chromadb
    
    client = chromadb.HttpClient(host="127.0.0.1", port=8000)
    

While only previews exist, `pip install VecturaDB` installs the newest preview. Once `1.0.0` is out, install a preview with its exact version, for example `pip install VecturaDB==1.0.0rc10.post1`: `--pre` takes the previews of the dependencies too, and a preview of httpx breaks the client.

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
    vecturadb run --path ./data
    

Windows (x64), in PowerShell:
    
    
    iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/VecturaDB/VecturaDB/main/rust/cli/install/install.ps1'))
    

The scripts install the newest release, previews included. Every binary is also in the [releases](https://github.com/VecturaDB/VecturaDB/releases). The command is `vecturadb`; with `VECTURADB_CHROMA_ALIAS=1` in the environment of the script, it is also installed as `chroma`.

## npm
    
    
    npx vecturadb run --path ./data --host 127.0.0.1 --port 8000
    

The package `vecturadb` installs the CLI of the release for the platform: Linux x64 and arm64 (glibc 2.17 and later), macOS x64 and arm64, Windows x64. There is none for Alpine (musl): use the Docker image there. While only previews exist, `npm install vecturadb` installs the newest preview.

On Windows x64, on 16 November 2026, `npx vecturadb run` with 1.0.0-preview.10.post1 started the server and the Chroma clients worked with it. With the default host it listened only on `::1`, the IPv6 address of localhost: `--host 127.0.0.1` makes it answer on `127.0.0.1`.

## Moving data out of Chroma Cloud

The `vecturadb copy` command copies collections from Chroma Cloud into a running VecturaDB, sparse and BM25 indexes included: see [Migrate from Chroma Cloud](https://vecturadb.org/migrate-from-chroma-cloud/). Guides for every destination, Chroma included: [Leaving Chroma Cloud](https://vecturadb.org/leaving-chroma-cloud/).

## Telemetry

Off by default. `ANONYMIZED_TELEMETRY=TRUE` turns on the anonymized telemetry inherited from Chroma, in the Python package only. The server binary sends none.
