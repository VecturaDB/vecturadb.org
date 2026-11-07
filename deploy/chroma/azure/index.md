Source: https://vecturadb.org/deploy/chroma/azure/

[Deploy](https://vecturadb.org/deploy/) / [Chroma](https://vecturadb.org/deploy/chroma/) / Azure

# Deploy Chroma on Azure, in your own subscription

Chroma 1.5.9 or VecturaDB, with HTTPS, from a Deploy to Azure button. The server and its data stay in your Azure account, Azure bills you directly, and the templates are open source.

## Choose a template

Recommended

### Virtual machine

For a server in use every day.

Estimated Azure cost

14.26 USD a month on your Azure bill

Standard_B2pts_v2 with its disks and public IP, whatever the use.

  * Always on: no wait at the first request
  * Faster: a query in 2.5 ms, an add in 112 ms
  * Backups of the data disk every 24 hours, kept 7 days
  * Chroma 1.5.9, or VecturaDB with API keys

[Deploy to Azure](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.5.1%2Fazure%2Fvm%2Fazuredeploy.json/createUIDefinitionUri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.5.1%2Fazure%2Fvm%2FcreateUiDefinition.json) [Details](https://vecturadb.org/deploy/chroma/azure/vm/)

### Container Apps

For a few hours of use a day.

Estimated Azure cost, with 3 hours of use a day

5.00 USD a month on your Azure bill

Within the free grant of Container Apps, with 5 USD of Azure Backup. Azure Files apart: 0.06 USD per GB a month.

  * Scales to zero about 10 minutes after the last request
  * Bills only the seconds a replica runs
  * HTTPS on its Azure address, open only to your IP addresses
  * Backups of the share every 24 hours, kept 7 days
  * Chroma 1.5.9

[Deploy to Azure](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.5.1%2Fazure%2Fcontainer-apps%2Fazuredeploy.json/createUIDefinitionUri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.5.1%2Fazure%2Fcontainer-apps%2FcreateUiDefinition.json) [Details](https://vecturadb.org/deploy/chroma/azure/container-apps/)

**The templates are free and open source (Apache 2.0).** You pay only Azure, which bills you directly: no fee from us.

**Before you choose Container Apps:** the first request after a pause waits 26-32 seconds, an update made while the app is in use needs a manual step, it is slower than the VM, the backups are to be taken while nobody writes, and the template has no API keys. [All its limits](https://vecturadb.org/deploy/chroma/azure/container-apps/#limits)

Times: medians in our tests, from a client in the same region. Costs: estimates with the Azure list prices of westeurope in USD, on 26 and 27 October and 6 November 2026.

## VM or Container Apps, side by side

We recommend the VM: it is always on, faster, and needs no manual step at updates. For a few hours of use a day, Container Apps costs less on your Azure bill.

What we compared| RecommendedVM| Container Apps  
---|---|---  
Best for| A server in use every day| A few hours of use a day  
Server| Chroma 1.5.9 or VecturaDB| Chroma 1.5.9  
Updates| Deploy again| Deploy again; while the app is in use, one manual step  
Backups| Every 24 hours, kept 7 days| Every 24 hours, kept 7 days, taken while nobody writes  
Estimated Azure cost a month  
In use all day| 14.26 USD| 52.63 USD  
8 hours a day| 14.26 USD| 15.69 USD  
3 hours a day| 14.26 USD| 5.00 USD  
In our tests  
Query, median| 2.5 ms| 5.2-5.7 ms  
Add, median| 112 ms| 434-448 ms  
First request after a pause| No pause: always on| 26-32 s, after about 10 minutes without requests  
Deployment from zero| 157-220 s| 15-18 min  
Deploy| [Deploy to Azure](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.5.1%2Fazure%2Fvm%2Fazuredeploy.json/createUIDefinitionUri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.5.1%2Fazure%2Fvm%2FcreateUiDefinition.json)| [Deploy to Azure](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.5.1%2Fazure%2Fcontainer-apps%2Fazuredeploy.json/createUIDefinitionUri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.5.1%2Fazure%2Fcontainer-apps%2FcreateUiDefinition.json)  
  
Costs estimated with the Azure list prices of westeurope in USD, on 26 and 27 October and 6 November 2026: the VM is a Standard_B2pts_v2; Container Apps has 0.5 CPU and 1 GiB, within the free grant, which the whole subscription shares, and 5 USD a month of Azure Backup. Not in the estimates: Azure Files for Container Apps, the snapshots of the backups. The details are on the pages of the [VM](https://vecturadb.org/deploy/chroma/azure/vm/) and of [Container Apps](https://vecturadb.org/deploy/chroma/azure/container-apps/).

## How it works

  1. ### Open the form

Deploy to Azure opens the form of the template in the Azure portal, in your subscription. You choose the region, a name, the size and the IP addresses that may connect.

  2. ### Create

Review the settings and create. In our tests the VM was ready in under 4 minutes, and Container Apps in 15-18 minutes.

  3. ### Connect

Open Outputs: `url` is the address of your server, over HTTPS. The Chroma clients connect to it.

    
    
    import chromadb
    
    client = chromadb.HttpClient(host="<the host in url>", port=443, ssl=True)

Python, `chromadb` 1.5.9: the connection we ran against both templates. VecturaDB with an API key also needs `headers={"x-chroma-token": "<your key>"}`.

**Disclaimer.** The templates and their scripts are provided as is, without warranty of any kind, as stated in the Apache License 2.0. The numbers on this page are what we measured between 25 and 28 October 2026 in westeurope: your region, sizes, data and versions may behave differently. You are responsible for your data: back it up, and test a restore on a copy before you rely on it.

Not sure about your case? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), describe your data and your setup, and we will take a look on a best-effort basis.

VecturaDB is an independent fork of Chroma, under the Apache License 2.0. The original code is copyright Chroma Inc. and its contributors. Not affiliated with, endorsed by or sponsored by Chroma Inc. CHROMA is a registered trademark of Chroma Inc., used here only to describe compatibility.
