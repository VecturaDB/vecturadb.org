Source: https://vecturadb.org/deploy/

# Deploy Chroma or VecturaDB in your own cloud

Open-source templates that create the server in your own cloud account, with HTTPS. Choose your cloud, then Chroma or VecturaDB, deploy from the page of its templates, and connect your Chroma client to the address it gives you.

## Choose your cloud, then the server

### Azure

A VM with backups, for Chroma 1.5.9 or VecturaDB, or Container Apps that scales to zero, for Chroma 1.5.9.

[Chroma](https://vecturadb.org/deploy/chroma/azure/) [VecturaDB](https://vecturadb.org/deploy/vecturadb/azure/)

### AWS

One EC2 instance with snapshots of its data, for Chroma 1.5.9 or VecturaDB.

[Chroma](https://vecturadb.org/deploy/chroma/aws/) [VecturaDB](https://vecturadb.org/deploy/vecturadb/aws/)

**The templates are free and open source (Apache 2.0).** You pay only your cloud, which bills you directly: no fee from us.

## Why your own cloud

  * ### Your account, your data

The server, its storage and its backups are resources of your own cloud account.

  * ### Your cloud's prices, no fee from us

Your cloud bills you at its list prices. The templates are free, under the Apache License 2.0.

  * ### Read it before you run it

The templates, their scripts and the numbers we measured are in the [VecturaDB.Deploy repository](https://github.com/VecturaDB/VecturaDB.Deploy).

**Disclaimer.** The templates and their scripts are provided as is, without warranty of any kind, as stated in the Apache License 2.0. The page of each cloud gives the numbers we measured there: your region, sizes, data and versions may behave differently. You are responsible for your data: back it up, and test a restore on a copy before you rely on it.

Not sure about your case? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), describe your data and your setup, and we will take a look on a best-effort basis.

VecturaDB is an independent fork of Chroma, under the Apache License 2.0. The original code is copyright Chroma Inc. and its contributors. Not affiliated with, endorsed by or sponsored by Chroma Inc. CHROMA is a registered trademark of Chroma Inc., used here only to describe compatibility.
