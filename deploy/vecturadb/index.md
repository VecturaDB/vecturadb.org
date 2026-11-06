Source: https://vecturadb.org/deploy/vecturadb/

[Deploy](https://vecturadb.org/deploy/) / VecturaDB

# Deploy VecturaDB, in your own cloud

VecturaDB 1.0.0-preview.8, built from Chroma, created by a template in your own cloud account, with HTTPS and API keys. Your data stays in your account, and the cloud bills you directly.

## Choose your cloud

### [Azure →A template for your Azure subscription: a VM with backups.](https://vecturadb.org/deploy/vecturadb/azure/) ### [AWS →A template for your AWS account: one EC2 instance with snapshots of its data.](https://vecturadb.org/deploy/vecturadb/aws/) ### [Google Cloud →A template for your Google Cloud project: one Compute Engine VM with snapshots of its data.](https://vecturadb.org/deploy/vecturadb/gcp/)

**The templates are free and open source (Apache 2.0).** You pay only your cloud, which bills you directly: no fee from us.

## What VecturaDB adds to Chroma

VecturaDB keeps the Chroma API, so the Chroma clients connect with the URL of the deployment. Some features of Chroma exist only in Chroma Cloud and in its distributed version: VecturaDB brings them to the single node.

  * ### API keys

Every request needs the key, in the `x-chroma-token` header. The templates ask for it in the form.

  * ### Sparse vectors and BM25

Sparse embeddings and the BM25 index, next to the dense vectors.

  * ### The Search API

Hybrid search included, with collection fork, on the single node.

[More about VecturaDB](https://vecturadb.org/).

**Disclaimer.** The templates and their scripts are provided as is, without warranty of any kind, as stated in the Apache License 2.0. The page of each cloud gives the numbers we measured there: your region, sizes, data and versions may behave differently. You are responsible for your data: back it up, and test a restore on a copy before you rely on it.

Not sure about your case? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), describe your data and your setup, and we will take a look on a best-effort basis.

VecturaDB is an independent fork of Chroma, under the Apache License 2.0. The original code is copyright Chroma Inc. and its contributors. Not affiliated with, endorsed by or sponsored by Chroma Inc. CHROMA is a registered trademark of Chroma Inc., used here only to describe compatibility.
