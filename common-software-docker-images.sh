#!/bin/bash

VAULT_VERSION=1.10.2

# Utilities
apt-get install -y --no-install-recommends wget \
                                           curl \
                                           jq \
                                           bash-completion \
                                           vim \
                                           unzip

# Install kubectl
curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && \
    chmod +x ./kubectl && \
    mv ./kubectl /usr/local/bin/kubectl

kubectl completion bash > /etc/bash_completion.d/kubectl

# Install helm
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 && \
    chmod 700 get_helm.sh && \
    ./get_helm.sh
    
helm completion bash > /etc/bash_completion.d/helm

# Install Minio client
wget https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc && \
    chmod +x /usr/local/bin/mc

# Install vault
wget https://releases.hashicorp.com/vault/${VAULT_VERSION}/vault_${VAULT_VERSION}_linux_amd64.zip -O vault.zip  && \
    unzip vault.zip -d /usr/local/bin/ && \
    rm vault.zip
vault -autocomplete-install
