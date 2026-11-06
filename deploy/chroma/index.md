Source: https://vecturadb.org/deploy/chroma/

[Deploy](https://vecturadb.org/deploy/) / Chroma

# Deploy self-hosted Chroma, in your own cloud

The open-source Chroma 1.5.9 server, or VecturaDB built from it, created by a template in your own cloud account, with HTTPS. Your data stays in your account, and the cloud bills you directly.

## Choose your cloud

### [Azure →Templates for your Azure subscription: a VM with backups, or Container Apps that scales to zero.](https://vecturadb.org/deploy/chroma/azure/) ### [AWS →A template for your AWS account: one EC2 instance with snapshots of its data.](https://vecturadb.org/deploy/chroma/aws/) ### [Google Cloud →A template for your Google Cloud project: one Compute Engine VM with snapshots of its data.](https://vecturadb.org/deploy/chroma/gcp/)

**The templates are free and open source (Apache 2.0).** You pay only your cloud, which bills you directly: no fee from us.

## Chroma 1.5.9 or VecturaDB

Both servers keep the Chroma API, so the Chroma clients connect with the URL of the deployment. In our tests the Python (chromadb 1.5.9) and JavaScript (chromadb 3.5.0) clients and a .NET client gave the same results on the two servers. The page of each cloud says which server each template runs.

### Chroma 1.5.9

The open-source single-node server, from the image `ghcr.io/chroma-core/chroma:1.5.9`.

### [VecturaDB 1.0.0-preview.8 →Built from Chroma, with sparse vectors, BM25, hybrid search, collection fork and API keys.](https://vecturadb.org/deploy/vecturadb/)

**Disclaimer.** The templates and their scripts are provided as is, without warranty of any kind, as stated in the Apache License 2.0. The page of each cloud gives the numbers we measured there: your region, sizes, data and versions may behave differently. You are responsible for your data: back it up, and test a restore on a copy before you rely on it.

Not sure about your case? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), describe your data and your setup, and we will take a look on a best-effort basis.

VecturaDB is an independent fork of Chroma, under the Apache License 2.0. The original code is copyright Chroma Inc. and its contributors. Not affiliated with, endorsed by or sponsored by Chroma Inc. CHROMA is a registered trademark of Chroma Inc., used here only to describe compatibility.
