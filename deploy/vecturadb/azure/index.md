Source: https://vecturadb.org/deploy/vecturadb/azure/

[Deploy](https://vecturadb.org/deploy/) / [VecturaDB](https://vecturadb.org/deploy/vecturadb/) / Azure

# Deploy VecturaDB on Azure, in your own subscription

VecturaDB with HTTPS and API keys, from a Deploy to Azure button with VecturaDB already chosen. The server and its data stay in your Azure account, Azure bills you directly, and the template is open source.

## The template

### Virtual machine

For a server in use every day.

Estimated Azure cost

14.26 USD a month on your Azure bill

Standard_B2pts_v2 with its disks and public IP, whatever the use.

  * Always on: no wait at the first request
  * On the VM itself: a query in 1.8 ms, an add in 17.7 ms
  * Backups of the data disk every 24 hours, kept 7 days
  * API keys: the form asks for one

[Deploy to Azure](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.4.0%2Fazure%2Fvm%2Fazuredeploy.json/createUIDefinitionUri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.4.0%2Fazure%2Fvm%2FcreateUiDefinition.vecturadb.json) [Details](https://vecturadb.org/deploy/vecturadb/azure/vm/)

**The template is free and open source (Apache 2.0).** You pay only Azure, which bills you directly: no fee from us.

Times: medians in our tests with VecturaDB 1.0.0-preview.7, on the VM itself. Cost: an estimate with the Azure list prices of westeurope in USD, on 26 October 2026, without the snapshots of the backups. The details are on the [page of the template](https://vecturadb.org/deploy/vecturadb/azure/vm/).

## How it works

  1. ### Open the form

Deploy to Azure opens the form of the template in the Azure portal, in your subscription, with VecturaDB already chosen. You choose the region, a name, the size, the API key and the IP addresses that may connect.

  2. ### Create

Review the settings and create. In our tests the VM was ready in 190 seconds, with HTTPS.

  3. ### Connect

Open Outputs: `url` is the address of your server, over HTTPS. The Chroma clients connect to it with the API key.

    
    
    import chromadb
    
    client = chromadb.HttpClient(host="<the host in url>", port=443, ssl=True,
                                 headers={"x-chroma-token": "<your key>"})

Python, `chromadb` 1.5.9: the connection we ran against the template with VecturaDB. Without the key, the server answers 401.

**Disclaimer.** The templates and their scripts are provided as is, without warranty of any kind, as stated in the Apache License 2.0. The numbers on this page are what we measured with VecturaDB 1.0.0-preview.7 on 5 November 2026 in westeurope: your region, sizes, data and versions may behave differently. You are responsible for your data: back it up, and test a restore on a copy before you rely on it.

Not sure about your case? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), describe your data and your setup, and we will take a look on a best-effort basis.

VecturaDB is an independent fork of Chroma, under the Apache License 2.0. The original code is copyright Chroma Inc. and its contributors. Not affiliated with, endorsed by or sponsored by Chroma Inc. CHROMA is a registered trademark of Chroma Inc., used here only to describe compatibility.
