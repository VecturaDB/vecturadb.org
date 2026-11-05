Source: https://vecturadb.org/deploy/vecturadb/azure/vm/

[Deploy](https://vecturadb.org/deploy/) / [VecturaDB](https://vecturadb.org/deploy/vecturadb/) / [Azure](https://vecturadb.org/deploy/vecturadb/azure/)

# VecturaDB on an Azure VM

One VecturaDB server in your own Azure subscription, with its data on a managed disk, HTTPS, API keys, allowed IP addresses and backups. From about 14 USD a month on your Azure bill.

[Deploy to Azure](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.3.0%2Fazure%2Fvm%2Fazuredeploy.json/createUIDefinitionUri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.3.0%2Fazure%2Fvm%2FcreateUiDefinition.vecturadb.json) [README of the template](https://github.com/VecturaDB/VecturaDB.Deploy/tree/azure-v1.3.0/azure/vm)

**Disclaimer.** This template and its scripts are provided as is, without warranty of any kind, as stated in the Apache License 2.0. The numbers on this page are what we measured with VecturaDB 1.0.0-preview.7 on 5 November 2026 in westeurope: your region, sizes, data and versions may behave differently. You are responsible for your data: back it up, and test a restore on a copy before you rely on it.

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

The template runs **VecturaDB 1.0.0-preview.7** (`ghcr.io/vecturadb/vecturadb:1.0.0-preview.7`), built from Chroma, with sparse vectors, BM25, hybrid search, collection fork and API keys. The same template can also run Chroma 1.5.9.

VecturaDB keeps the Chroma API: the Chroma clients connect with the URL of the deployment and the API key. In our tests the Python client (chromadb 1.5.9) worked over HTTPS with the key, and VecturaDB answered 401 without it.

Resource| Notes  
---|---  
Ubuntu 24.04 VM| Docker runs the server; Caddy serves HTTPS in front of it  
Data disk, Standard SSD| Mounted at `/var/lib/chroma`; 16 GiB by default  
Network security group| Opens only what the access mode needs  
Virtual network and network interface| 10.42.0.0/16  
Public IP, Standard| Only with HTTPS access  
Backup vault| Only with backups on: Azure Disk Backup of the data disk  
  
## Deploy

[Deploy to Azure](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.3.0%2Fazure%2Fvm%2Fazuredeploy.json/createUIDefinitionUri/https%3A%2F%2Fraw.githubusercontent.com%2FVecturaDB%2FVecturaDB.Deploy%2Fazure-v1.3.0%2Fazure%2Fvm%2FcreateUiDefinition.vecturadb.json)

The button opens the form of the Azure portal with the template of the tag `azure-v1.3.0`, VecturaDB already chosen and `vecturadb` as the name. The form asks for the API key. When the portal shows “Your deployment is complete”, open **Outputs** in the menu on the left: `url` is the address of the server, for the clients.

In our tests| Time  
---|---  
Deployment from zero, until Caddy held the certificate| 190 s  
  
With the Azure CLI:
    
    
    az group create -n my-vecturadb -l westeurope
    az deployment group create -g my-vecturadb \
      --template-uri https://raw.githubusercontent.com/VecturaDB/VecturaDB.Deploy/azure-v1.3.0/azure/vm/azuredeploy.json \
      -p name=vecturadb engine=vecturadb apiKey=<your key> \
         access=allowed-ips allowedIpRanges='["203.0.113.10/32"]' \
         adminPublicKey="$(cat ~/.ssh/id_ed25519.pub)"

The template, its scripts and its README are in the [VecturaDB.Deploy repository](https://github.com/VecturaDB/VecturaDB.Deploy), under [`azure/vm`](https://github.com/VecturaDB/VecturaDB.Deploy/tree/azure-v1.3.0/azure/vm).

## Access and HTTPS

Access| What is open| Address  
---|---|---  
Allowed IP addresses| 443 from your IP ranges; 80 for the certificate only| https://, with the Azure name of the public IP or your domain  
Public| 443 and 80 from anywhere| https://  
Internal| Nothing from the internet; port 8000 inside the virtual network| http://, on the private address  
  
  * Every request needs the API key, in the `x-chroma-token` header.
  * Caddy gets a Let's Encrypt certificate and forwards to the server on 127.0.0.1.
  * Port 80 answers only the challenge of the certificate.
  * Ports 22 and 8000 stay closed.
  * The deployment ends only when Caddy holds the certificate.

On the VM itself, against the server without Caddy (median, Standard_B2pts_v2, 5 November 2026)| Time  
---|---  
Query| 1.8 ms  
Get| 1.8 ms  
Add of 2 records| 17.7 ms  
8 concurrent writers, in all| 2.5 s  
  
## Cost

The sizes we tested, with the list prices of westeurope in USD for 730 hours a month, on 26 October 2026:

Size| CPU, memory| VM| Disks (OS E4, data E3)| Public IP| Total a month  
---|---|---|---|---|---  
Standard_B2pts_v2 (default, Arm)| 2, 1 GiB| 7.01| 3.60| 3.65| 14.26  
Standard_B1s| 1, 1 GiB| 8.76| 3.60| 3.65| 16.01  
Standard_B1ms| 1, 2 GiB| 17.52| 3.60| 3.65| 24.77  
  
  * With internal access there is no public IP: 3.65 USD less.
  * Not in the table: disk transactions, outbound traffic and the snapshots of the backups.
  * B1s and B1ms belong to the Bv1 series, which Azure lists as [End of Life](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/general-purpose/bv1-series): that is why the default is B2pts_v2.
  * B-series sizes stay at a baseline CPU once their credits run out: 20% for B2pts_v2 ([Bpsv2 series](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/general-purpose/bpsv2-series)). A server that is busy all the time needs another size.
  * A new [Azure free account](https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account) includes, for 12 months, "750 hours each of B1s, B2pts v2 (Arm-based), and B2ats v2 (AMD-based) burstable VMs" ([details](https://learn.microsoft.com/en-us/azure/cost-management-billing/manage/create-free-services)).

## Backups and restore

  * With backups on, the default, Azure Disk Backup takes incremental snapshots of the data disk every 24 hours, or every 4, 6, 8 or 12 hours, and keeps them 7 days.
  * Azure Disk Backup has no fee per protected disk. The snapshots are billed at the price of standard storage, 0.05 USD per GB a month in westeurope: the first one for the used part of the disk, the next ones for the changes.
  * Soft delete is on: deleted backups stay 14 days.
  * The snapshots are taken while the server runs, so a restored disk is like a disk after a power cut. In our tests its file system recovered its journal, and VecturaDB started on it with all the data of the backup.

### Restore

  1. In the backup vault, restore a recovery point to a new disk in the same resource group: Backup instances, then Restore.
  2. Attach the new disk at LUN 1 and run `restore.sh`: it copies the data of the backup over the data disk and starts the server again.
  3. Detach and delete the new disk.

    
    
    az vm disk attach -g my-vecturadb --vm-name vecturadb --name <restored disk> --lun 1
    az vm run-command invoke -g my-vecturadb -n vecturadb --command-id RunShellScript --scripts @restore.sh
    az vm disk detach -g my-vecturadb --vm-name vecturadb --name <restored disk>
    az disk delete -g my-vecturadb -n <restored disk>

**The data written after the backup is lost:** take an on-demand backup first if you may want it back. The data disk stays the same, so the backups go on.

In our tests| Time  
---|---  
On-demand backup, until the recovery point| 176 s  
Restore to a new disk| 62 s  
Attach at LUN 1| 9-11 s  
`restore.sh`| 33-36 s  
Detach and delete| 25 s  
  
After the restore VecturaDB held the data of the backup, 250 records, and not the collection written after it. A snapshot of the data disk taken right after a restore, restored in turn, held every collection.

## Updates

  * To change the server, its image, the key or the access, deploy the template again: it stops the old container and starts the new one, with the data on the data disk.
  * The server does not answer during the switch.
  * Docker starts only once the data disk is mounted: a VM that boots without it serves nothing, rather than an empty database.
  * Ubuntu installs its security updates by itself. Caddy comes from its own repository: you update it.

## Delete everything

Deleting the resource group deletes the deployment, the snapshots of the backups included. With backups on, two things stop it first: the backup instance of the data disk, and the soft delete of the vault, on by default. So turn soft delete off, delete the backup instance, then delete the group. Without backups, delete the group.

### In the portal

  1. Open the backup vault, `<name>-backup`. Under Manage, open Properties. In Cyber recovery settings, on the Soft delete row, select Update, clear Enable Soft Delete, and select Update.
  2. Under Manage, open Backup instances. The filter starts on another datasource type, so the list looks empty: set Datasource type to Azure Disks, and open `<name>-data`.
  3. Select Delete. Type the name of the instance, choose a reason and write a comment: all three are required. Select Delete, then Confirm.
  4. Open the resource group and select Delete resource group. Type the name of the group, select Delete, then Delete again to confirm.

### With the Azure CLI
    
    
    SUB=$(az account show --query id -o tsv); RG=my-vecturadb; NAME=vecturadb
    VAULT="https://management.azure.com/subscriptions/$SUB/resourceGroups/$RG/providers/Microsoft.DataProtection/backupVaults/$NAME-backup"
    az rest --method patch --url "$VAULT?api-version=2024-04-01"   --body '{"properties":{"securitySettings":{"softDeleteSettings":{"state":"Off","retentionDurationInDays":14}}}}'
    az rest --method delete --url "$VAULT/backupInstances/$NAME-data?api-version=2024-04-01"
    # The deletion goes on in the background: wait until the backup instance is gone.
    while az rest --method get --url "$VAULT/backupInstances/$NAME-data?api-version=2024-04-01" -o none 2>/dev/null; do sleep 10; done
    az group delete -n $RG --yes

In our tests, with the CLI| Time  
---|---  
Soft delete off| 2 s  
Backup instance gone| 93 s  
Resource group gone| 126 s  
  
The [README of the template](https://github.com/VecturaDB/VecturaDB.Deploy/tree/azure-v1.3.0/azure/vm#delete-everything) also says how to get out of the soft-deleted state, if you deleted the backup instance with soft delete on.

## Limits

  * One VM and one disk: no high availability.
  * While the VM restarts or a deployment switches the container, the server does not answer.
  * A new deployment restarts the server, even when nothing changes.
  * The backups are snapshots in the same region.
  * A disk attached by hand at LUN 0 needs `--caching ReadOnly`, as the template sets it: otherwise a later deployment changes the caching, and Azure detaches and attaches the disk while the VM runs.

VecturaDB is an independent fork of Chroma, under the Apache License 2.0. The original code is copyright Chroma Inc. and its contributors.

Not affiliated with, endorsed by or sponsored by Chroma Inc. CHROMA is a registered trademark of Chroma Inc., used here only to describe compatibility.
