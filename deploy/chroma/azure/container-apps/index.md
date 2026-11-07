Source: https://vecturadb.org/deploy/chroma/azure/container-apps/

[Deploy](https://vecturadb.org/deploy/) / [Chroma](https://vecturadb.org/deploy/chroma/) / [Azure](https://vecturadb.org/deploy/chroma/azure/)

# Chroma on Azure Container Apps

Chroma 1.5.9 on Azure Container Apps, with the data on an Azure Files share and backups with Azure Backup. The app scales to zero when nobody uses it, so on idle days you pay almost only for the storage and the backups.

[Deploy to Azure](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.5.0%2Fazure%2Fcontainer-apps%2Fazuredeploy.json/createUIDefinitionUri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.5.0%2Fazure%2Fcontainer-apps%2FcreateUiDefinition.json) [Compare with the VM](https://vecturadb.org/deploy/chroma/azure/#compare)

**For a few hours of use a day.** For a server in use all day, the [VM template](https://vecturadb.org/deploy/chroma/azure/vm/) is cheaper, faster and needs no manual step at updates: it is the one we recommend.

**Disclaimer.** This template and its scripts are provided as is, without warranty of any kind, as stated in the Apache License 2.0. The numbers on this page are what we measured on 25, 26, 27 and 28 October and on 6 and 7 November 2026 in westeurope: your region, data and versions may behave differently. You are responsible for your data: back it up, and test a restore on a copy before you rely on it.

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
Recovery Services vault| Only with backups on: Azure Backup of the share, with the snapshots in the storage account  
  
The server reaches the share through two mounts:

  * the data, with `nobrl`: byte-range locks stay on the replica. With the locks sent to the server, Chroma 1.5.9 did not start in our tests;
  * a lock file, without `nobrl`: its lock reaches the server, so it holds across replicas and hosts. A new replica waits for it before it starts the server.

## Deploy

[Deploy to Azure](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.5.0%2Fazure%2Fcontainer-apps%2Fazuredeploy.json/createUIDefinitionUri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.5.0%2Fazure%2Fcontainer-apps%2FcreateUiDefinition.json)

The button opens the form of the Azure portal with the template of the tag `azure-v1.5.0`. When the portal shows “Your deployment is complete”, open **Outputs** in the menu on the left: `url` is the address of the server, for the clients.

In our tests| Time  
---|---  
Deployment from zero, most of it for the Container Apps environment| 15-18 min (881-1067 s)  
  
With the Azure CLI:
    
    
    az group create -n my-chroma -l westeurope
    az deployment group create -g my-chroma \
      --template-uri https://raw.githubusercontent.com/VecturaDB/VecturaDB.Deploy/azure-v1.5.0/azure/container-apps/azuredeploy.json \
      -p allowedIpRanges='["203.0.113.10/32"]'

The template and its README are in the [VecturaDB.Deploy repository](https://github.com/VecturaDB/VecturaDB.Deploy), under [`azure/container-apps`](https://github.com/VecturaDB/VecturaDB.Deploy/tree/azure-v1.5.0/azure/container-apps).

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
Azure Backup, with backups on (the default)| 5 USD a month for the share, at the list prices of westeurope on 6 November 2026; Azure Files bills the snapshots at 0.06 USD per GB a month, for the data that changed  
Log Analytics| The logs it receives  
  
Other apps in the same subscription use the same free grant.

## Backups and restore

With backups on, the default, Azure Backup takes a snapshot of the share every 24 hours, the first of the day at 02:00 UTC, and keeps it 7 days. A backup every 4, 6, 8, 12 or 24 hours, up to 200 snapshots: 200 days with a backup every 24 hours, 99 every 12, 65 every 8, 49 every 6 and 32 every 4. The snapshots stay in the storage account, next to the share.

Azure Backup puts a delete lock on the storage account, so that nobody deletes the account or the share by mistake. The lock goes away when the account is unregistered from the vault. The soft delete of Azure Backup does not cover the snapshots of a share; the share has a soft delete of its own, 7 days.

**Take the backups while nobody writes.** A snapshot taken while the server saves the index of a collection holds that index halfway, as a power cut would. In our tests a backup taken a few seconds after 2,000 records were added gave that collection back broken: after the restore it answered “Error getting embedding”. This is how Chroma 1.5.9 behaves after a power cut with more than 1,000 records in a collection, not a fault of Azure Backup. The backups taken with the server stopped came back whole, the collections of 1,500 and 2,000 records included.

  * **The scheduled backup** starts within 2 hours of 02:00 UTC. If nobody uses the app then, it has no replica, and the backup holds files that nothing is writing.
  * **An on-demand backup:** deactivate the revision first, and activate it again after the backup.

    
    
    REV=$(az containerapp revision list -g my-chroma -n chroma --query "[0].name" -o tsv)
    ACCOUNT=$(az storage account list -g my-chroma --query "[0].name" -o tsv)
    az containerapp revision deactivate -g my-chroma -n chroma --revision $REV
    JOB=$(az backup protection backup-now -g my-chroma -v chroma-backup -c $ACCOUNT -i data \
      --backup-management-type AzureStorage --workload-type AzureFileShare --query name -o tsv)
    az backup job wait -g my-chroma -v chroma-backup -n $JOB
    az containerapp revision activate -g my-chroma -n chroma --revision $REV

To restore, with the revision deactivated as above, restore a recovery point to the original location of the share, overwriting the files, then activate the revision:
    
    
    az backup recoverypoint list -g my-chroma -v chroma-backup -c $ACCOUNT -i data \
      --backup-management-type AzureStorage --workload-type AzureFileShare -o table
    JOB=$(az backup restore restore-azurefileshare -g my-chroma -v chroma-backup -c $ACCOUNT -i data -r <recovery point> \
      --resolve-conflict Overwrite --restore-mode OriginalLocation --query name -o tsv)
    az backup job wait -g my-chroma -v chroma-backup -n $JOB
    az containerapp revision activate -g my-chroma -n chroma --revision $REV

In the portal the same restore is Restore Share in the backup item of the share, with Original Location and Overwrite ([Microsoft's steps](https://learn.microsoft.com/en-us/azure/backup/restore-afs)); we tested it with the Azure CLI only.

**The data written after the backup is lost:** take an on-demand backup first if you may want it back. The restore overwrites the files of the backup and leaves the others: the folders of the collections created after the backup stay in the share, and the server does not use them.

In our tests| Time  
---|---  
Deactivation of the revision, until no replica| 35-43 s  
On-demand backup, the job| 3-5 s  
Restore to the original location, the job| 33-188 s  
Activation, until the server answers| 25-45 s  
  
After the restores the server held the collections of the backup, with all their records, and not the ones written after it. The next backup worked on the same share.

## Updates

A new deployment, with other settings or another image, creates a new revision. Its replica waits for the lock held by the old one, and the deployment ends anyway.

  * **While the app is in use:** deactivate the old revision, the one that is not Activating, within 5 minutes.
  * **While the app has no replica** , about 10 minutes after the last request: nothing to do. Nothing holds the lock, and the old revision goes away by itself.
  * **With backups on:** add `backupAlreadyOn=true` to every new deployment; in the portal, tick “The backups are already on” in Backups. The share stays protected as it is, and only the schedule and the days kept are applied again. Without it, Azure Backup starts two configure jobs on the share at the same time, and one of them fails; the share stays protected anyway. Never on the first deployment: the share would not be protected.

    
    
    az containerapp revision list -g my-chroma -n chroma --query "[?properties.active].{name:name, state:properties.runningState}" -o table
    az containerapp revision deactivate -g my-chroma -n chroma --revision <the old revision, the one that is not Activating>

In our tests the old revision kept serving while the new one waited, and the new revision answered with all the data.

In our tests| Time  
---|---  
No answer after the deactivation, until the new revision serves| About 6 s  
Wait after which the new revision shows Failed| 5 min  
Start of a Failed revision, after a later deactivation| 22 s  
A new deployment with `backupAlreadyOn=true`; the configure job of the policy| 36-100 s; 1-5 min  
  
A new deployment with the Azure CLI, the backups on, and the parameters of the first deployment:
    
    
    az deployment group create -g my-chroma \
      --template-uri https://raw.githubusercontent.com/VecturaDB/VecturaDB.Deploy/azure-v1.5.0/azure/container-apps/azuredeploy.json \
      -p allowedIpRanges='["203.0.113.10/32"]' backupAlreadyOn=true

## Delete everything

Without backups, deleting the resource group deletes the whole deployment. With backups on, two things stop the deletion first: the lock of Azure Backup on the storage account, and the share protected in the vault. So stop the protection and delete its backup data, unregister the storage account, which also removes the lock, then delete the group:
    
    
    ACCOUNT=$(az storage account list -g my-chroma --query "[0].name" -o tsv)
    az backup protection disable -g my-chroma -v chroma-backup -c $ACCOUNT -i data \
      --backup-management-type AzureStorage --workload-type AzureFileShare --delete-backup-data true --yes
    az backup container unregister -g my-chroma -v chroma-backup -c $ACCOUNT --backup-management-type AzureStorage --yes
    az lock list -g my-chroma -o table
    az group delete -n my-chroma --yes

In our tests `az backup container unregister` answered `CloudInternalError` every time, but the account was unregistered: the lock was gone at once, and the group was then deleted. Before the deletion of the group, `az lock list` must show no lock.

In the portal: in the vault `chroma-backup`, stop the backup of the share with Delete Backup Data, then unregister the storage account under Backup Infrastructure ([Microsoft's steps](https://learn.microsoft.com/en-us/azure/backup/manage-afs-backup#stop-protection-on-a-file-share)). Then open the resource group and select Delete resource group. Type the name of the group, select Delete, then Delete again to confirm. We tested the deletion with the Azure CLI only.

In our tests| Time  
---|---  
Protection stopped, backup data deleted| 33-104 s  
Storage account unregistered| 18-44 s  
Deletion of the resource group, most of it for the Container Apps environment| 27-30 min (1632-1817 s)  
  
Three things stay recoverable for 14 days after the deletion, as Azure does for these resources, and then go away:

  * the vault, empty, in soft delete: Azure purges it 14 days after the protection was stopped ([soft delete for Azure Backup](https://learn.microsoft.com/en-us/azure/backup/secure-by-default));
  * the storage account, with the share and the data in it ([recover a deleted storage account](https://learn.microsoft.com/en-us/azure/storage/common/storage-account-recover));
  * the Log Analytics workspace, with the logs ([delete and recover a workspace](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/delete-workspace)).

To remove the logs at once, delete the workspace permanently before the group:
    
    
    az monitor log-analytics workspace delete -g my-chroma -n chroma-logs --force --yes

## Limits

  * An update made while the app is in use needs a manual step: see Updates.
  * After about 10 minutes without requests the app scales to zero, and the next request waits: set the timeout of your client above that.
  * One replica at most: no horizontal scale.
  * Slower than the VM: the data sits on a network share.
  * No API keys.
  * Take the backups while nobody writes: see Backups and restore.
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
