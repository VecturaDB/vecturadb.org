Source: https://vecturadb.org/deploy/chroma/azure/container-apps/

[Deploy](https://vecturadb.org/deploy/) / [Chroma](https://vecturadb.org/deploy/chroma/) / [Azure](https://vecturadb.org/deploy/chroma/azure/)

# Chroma on Azure Container Apps

Chroma 1.5.9 on Azure Container Apps, with the data on an Azure Files share. The app scales to zero when nobody uses it, so it costs almost nothing on idle days.

[Deploy to Azure](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.3.0%2Fazure%2Fcontainer-apps%2Fazuredeploy.json/createUIDefinitionUri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.3.0%2Fazure%2Fcontainer-apps%2FcreateUiDefinition.json) [Compare with the VM](https://vecturadb.org/deploy/chroma/azure/#compare)

**For a few hours of use a day.** For a server in use all day, the [VM template](https://vecturadb.org/deploy/chroma/azure/vm/) is cheaper, faster and needs no manual step at updates: it is the one we recommend.

**Disclaimer.** This template and its scripts are provided as is, without warranty of any kind, as stated in the Apache License 2.0. The numbers on this page are what we measured on 25, 26, 27 and 28 October 2026 in westeurope: your region, data and versions may behave differently. You are responsible for your data: back it up, and test a restore on a copy before you rely on it.

Not sure about your case? [Open an issue in the VecturaDB repository](https://github.com/VecturaDB/VecturaDB/issues/new), describe your data and your setup, and we will take a look on a best-effort basis.

On this page

  1. What it creates
  2. Deploy
  3. Access and HTTPS
  4. Cost
  5. Backups and restore
  6. Updates
  7. Delete everything
  8. Limits

## What it creates

Resource| Notes  
---|---  
Container app| Chroma 1.5.9 (`ghcr.io/chroma-core/chroma:1.5.9`); one replica at most, scale to zero, HTTPS ingress on the Azure name of the app  
Container Apps environment| Consumption plan  
Storage account and file share| SMB, transaction optimized, 100 GiB quota; soft delete of the share, 7 days  
Log Analytics workspace| The logs of the app, 30 days by default  
  
The server reaches the share through two mounts:

  * the data, with `nobrl`: byte-range locks stay on the replica. With the locks sent to the server, Chroma 1.5.9 did not start in our tests;
  * a lock file, without `nobrl`: its lock reaches the server, so it holds across replicas and hosts. A new replica waits for it before it starts the server.

## Deploy

[Deploy to Azure](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.3.0%2Fazure%2Fcontainer-apps%2Fazuredeploy.json/createUIDefinitionUri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.3.0%2Fazure%2Fcontainer-apps%2FcreateUiDefinition.json)

The button opens the form of the Azure portal with the template of the tag `azure-v1.3.0`. When the portal shows “Your deployment is complete”, open **Outputs** in the menu on the left: `url` is the address of the server, for the clients.

In our tests| Time  
---|---  
Deployment from zero, most of it for the Container Apps environment| 15-18 min (881-1067 s)  
  
With the Azure CLI:
    
    
    az group create -n my-chroma -l westeurope
    az deployment group create -g my-chroma \
      --template-uri https://raw.githubusercontent.com/VecturaDB/VecturaDB.Deploy/azure-v1.3.0/azure/container-apps/azuredeploy.json \
      -p allowedIpRanges='["203.0.113.10/32"]'

The template and its README are in the [VecturaDB.Deploy repository](https://github.com/VecturaDB/VecturaDB.Deploy), under [`azure/container-apps`](https://github.com/VecturaDB/VecturaDB.Deploy/tree/azure-v1.3.0/azure/container-apps).

## Access and HTTPS

Access| Who reaches the server| Address  
---|---|---  
Allowed IP addresses| Only the IP ranges you give| https://, on the Azure name of the app  
Internal| Only the apps in the same Container Apps environment| `url`, inside the environment  
  
  * HTTPS comes from Container Apps, on the Azure name of the app.
  * No API keys: Chroma 1.5.9 has none, so the template has no public access.

## Cost

Container Apps bills the seconds a replica runs: active while it serves, at a lower rate while it waits before scaling to zero. The first 180,000 vCPU-seconds, 360,000 GiB-seconds and 2 million requests of each month are free, for the whole subscription.

With 0.5 CPU and 1 GiB, at the list prices of westeurope in USD on 27 October 2026:

Use| Container Apps, with the free grant| Without the free grant| VM template (B2pts_v2)  
---|---|---|---  
In use all day, every day| 47.63| 55.19| 14.26  
8 hours a day| 10.69| 18.25| 14.26  
3 hours a day| 0.00| 6.91| 14.26  
One hour a month| 0.00| 0.09| 14.26  
  
Not in the table:

Also billed| In our tests  
---|---  
Azure Files, the stored data| 0.06 USD per GB a month  
Azure Files, the transactions of the writes| About 0.03 USD for every 1,000 writes; reads cost almost nothing  
A replica that waits without requests| About 27 transactions a minute  
Log Analytics| The logs it receives  
  
Other apps in the same subscription use the same free grant.

## Backups and restore

**No backups:** the template does not back up the share. Soft delete keeps a deleted share for 7 days, but it does not bring back data that was changed or deleted inside it. For backups, use the [VM template](https://vecturadb.org/deploy/chroma/azure/vm/#backups-and-restore).

## Updates

A new deployment, with other settings or another image, creates a new revision. Its replica waits for the lock held by the old one, and the deployment ends anyway.

  * **While the app is in use:** deactivate the old revision, the one that is not Activating, within 5 minutes.
  * **While the app has no replica** , about 10 minutes after the last request: nothing to do. Nothing holds the lock, and the old revision goes away by itself.

    
    
    az containerapp revision list -g my-chroma -n chroma --query "[?properties.active].{name:name, state:properties.runningState}" -o table
    az containerapp revision deactivate -g my-chroma -n chroma --revision <the old revision, the one that is not Activating>

In our tests the old revision kept serving while the new one waited, and the new revision answered with all the data.

In our tests| Time  
---|---  
No answer after the deactivation, until the new revision serves| About 6 s  
Wait after which the new revision shows Failed| 5 min  
Start of a Failed revision, after a later deactivation| 22 s  
  
## Delete everything

There is no backup vault here: deleting the resource group deletes the whole deployment. In the portal, open the resource group and select Delete resource group. Type the name of the group, select Delete, then Delete again to confirm. With the Azure CLI:
    
    
    az group delete -n my-chroma --yes

In our tests| Time  
---|---  
Deletion of the resource group, most of it for the Container Apps environment| 27-30 min (1632-1810 s)  
  
Two things stay recoverable for 14 days after the deletion, as Azure does for these resources, and then go away:

  * the storage account, with the share and the data in it ([recover a deleted storage account](https://learn.microsoft.com/en-us/azure/storage/common/storage-account-recover));
  * the Log Analytics workspace, with the logs ([delete and recover a workspace](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/delete-workspace)).

To remove the logs at once, delete the workspace permanently before the group:
    
    
    az monitor log-analytics workspace delete -g my-chroma -n chroma-logs --force --yes

## Limits

  * An update made while the app is in use needs a manual step: see Updates.
  * After about 10 minutes without requests the app scales to zero, and the next request waits: set the timeout of your client above that.
  * One replica at most: no horizontal scale.
  * Slower than the VM: the data sits on a network share.
  * No backups, and no API keys.
  * A lock can outlive its replica: see A lock left by a lost replica.

In our tests| Time  
---|---  
From the last request to zero replicas| 582-613 s  
First request after scaling to zero| 26-32 s  
Lock kept after its host disappeared| 655 s  
  
Medians from a client in the same region, in milliseconds:

Operation| VM (B2pts_v2, Standard SSD)| Container Apps (0.5 CPU, 1 GiB, SMB)  
---|---|---  
query| 2.5| 5.2-5.7  
count| 2.1| 4.4-4.5  
get| 4.1| 8.6-8.8  
add| 112| 434-448  
small add| 74| 136-147  
8 concurrent writers, total| 16.2 s| 25.3-26.2 s  
  
### A lock left by a lost replica

When the host of the replica disappears without closing its files, Azure Files keeps the lock on the lock file until it gives up on that host. Until then the next replica waits, and the server does not answer. To free the lock earlier, close only the handle of the lost replica:
    
    
    ACCOUNT=$(az storage account list -g my-chroma --query "[0].name" -o tsv)
    KEY=$(az storage account keys list -g my-chroma -n $ACCOUNT --query "[0].value" -o tsv)
    az storage share list-handle --account-name $ACCOUNT --account-key $KEY --name data --path .lock -o table
    az storage share close-handle --account-name $ACCOUNT --account-key $KEY --name data --path .lock \
      --handle-id <the handle of the lost replica>

The list shows a handle for each replica that opened the file, with its client IP and the time it was opened: the lost replica is the older one. Never use `--close-all`: in our tests it also closed the handle of the process that was waiting, which then failed with an input/output error.

VecturaDB is an independent fork of Chroma, under the Apache License 2.0. The original code is copyright Chroma Inc. and its contributors.

Not affiliated with, endorsed by or sponsored by Chroma Inc. CHROMA is a registered trademark of Chroma Inc., used here only to describe compatibility.
