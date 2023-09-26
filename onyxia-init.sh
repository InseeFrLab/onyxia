#!/usr/bin/env bash


echo "start of onyxia-init.sh script en tant que :"
whoami

if [  "`which jq`" = "" ]; then
    if [  "`which apt`" != "" ]; then
        sudo apt-get update -y && sudo apt-get install -y jq
    fi
fi

if  [[ -n "$VAULT_RELATIVE_PATH" ]]; then

    if [  "`which wget`" = "" ]; then
        if [  "`which apt`" != "" ]; then
            sudo apt-get update -y && sudo apt-get install -y wget
        fi
    fi
    JSON=$(wget -qO- \
        --header="X-Vault-Token: $VAULT_TOKEN" \
        $VAULT_ADDR/v1/$VAULT_MOUNT/data/$VAULT_TOP_DIR/$VAULT_RELATIVE_PATH )

    KEYS=""

    if [ "$(jq -r '.data.data.".onyxia"' <<< "$JSON")" == "null" ]
    then
        KEYS=$(jq -r '.data.data | keys | .[]' <<< "$JSON")
    else
        KEYS=$(jq -r '.data.data.".onyxia".keysOrdering | .[]' <<< "$JSON")
    fi

    for i in $KEYS; 
    do 
        echo $i
        export $i=$(eval echo $(jq -r ".data.data.$i" <<< "$JSON"))
        sudo sh -c "echo $i=\"`jq -r \".data.data.$i\" <<< \"$JSON\"`\" >> /etc/environment"
        if [[ -e "/usr/local/lib/R/etc/" ]]; then
            sudo sh -c "echo $i=\"`jq -r \".data.data.$i\" <<< \"$JSON\"`\" >> /usr/local/lib/R/etc/Renviron.site"
        fi
    done
fi

if [  "`which kubectl`" != "" ]; then
    kubectl config set-cluster in-cluster --server=https://kubernetes.default --certificate-authority=/var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    kubectl config set-credentials user --token `cat /var/run/secrets/kubernetes.io/serviceaccount/token`
    kubectl config set-context in-cluster --user=user --cluster=in-cluster --namespace=`cat /var/run/secrets/kubernetes.io/serviceaccount/namespace`
    kubectl config use-context in-cluster
    export KUBERNETES_SERVICE_ACCOUNT=`cat /var/run/secrets/kubernetes.io/serviceaccount/token | tr "." "\n" | head -2 | tail -1 | base64 --decode | jq -r ' .["kubernetes.io"].serviceaccount.name'`
    export KUBERNETES_NAMESPACE=`cat /var/run/secrets/kubernetes.io/serviceaccount/namespace`
    # Fix permissions on kubectl config file
    if [[ $(id -u) = 0 ]] && grep -q "onyxia" /etc/passwd; then 
        # For internal images that need to be run as root
        chown -R onyxia:users ${HOME}/.kube 
    else
        # For community-based images
        chmod 640 ${HOME}/.kube/config
    fi
fi



if [  "`which mc`" != "" ]; then
    export MC_HOST_s3=https://$AWS_ACCESS_KEY_ID:$AWS_SECRET_ACCESS_KEY:$AWS_SESSION_TOKEN@$AWS_S3_ENDPOINT
fi

if [[ $(id -u) = 0 ]]; then
    env | sed 's/^/export /g' | grep "AWS\|VAULT\|KC\|KUB\|MC" >> /root/.bashrc
fi


if [  "`which git`" != "" ]; then
    if [[ -n "$GIT_REPOSITORY" ]]; then
        if [[ -n "$GIT_PERSONAL_ACCESS_TOKEN" ]]; then
            REPO_DOMAIN=`echo "$GIT_REPOSITORY" | awk -F/ '{print $3}'`
            if [  $REPO_DOMAIN = "github.com" ]; then
                COMMAND=`echo git clone $GIT_REPOSITORY | sed "s/$REPO_DOMAIN/$GIT_PERSONAL_ACCESS_TOKEN@$REPO_DOMAIN/"`
            else
                COMMAND=`echo git clone $GIT_REPOSITORY | sed "s/$REPO_DOMAIN/oauth2:$GIT_PERSONAL_ACCESS_TOKEN@$REPO_DOMAIN/"`
            fi
        else
            COMMAND=`echo git clone $GIT_REPOSITORY`
        fi

        if [[ -n "$GIT_BRANCH" ]]; then
            COMMAND="$COMMAND --branch $GIT_BRANCH"
        fi

        if [[ -n "$ROOT_PROJECT_DIRECTORY" ]]; then
            if [[ `ls $ROOT_PROJECT_DIRECTORY | grep -v "lost+found"` = "" ]]; then
                cd $ROOT_PROJECT_DIRECTORY 
                $COMMAND               
                for f in *; do
                    echo $f
                    if [[ -d "$f" && $f != "lost+found" ]]; then
                        echo directory
                        chown -R $PROJECT_USER:$PROJECT_GROUP $f
                    fi
                done
                cd $HOME  
            fi

        fi
    fi
    if [[ $(id -u) = 0 ]]; then
        echo "git config --system"
        if [ -n "$GIT_USER_NAME" ]; then
            git config --system user.name "$GIT_USER_NAME"
        fi
    
        if [ -n "$GIT_USER_MAIL" ]; then
            git config --system user.email "$GIT_USER_MAIL"
        fi
        if [ -n "$GIT_CREDENTIALS_CACHE_DURATION" ]; then
            git config --system credential.helper "cache --timeout=$GIT_CREDENTIALS_CACHE_DURATION"
        fi
    else
        echo "git config --global"
        if [ -n "$GIT_USER_NAME" ]; then
            git config --global user.name "$GIT_USER_NAME"
        fi
    
        if [ -n "$GIT_USER_MAIL" ]; then
            git config --global user.email "$GIT_USER_MAIL"
        fi
        if [ -n "$GIT_CREDENTIALS_CACHE_DURATION" ]; then
            git config --global credential.helper "cache --timeout=$GIT_CREDENTIALS_CACHE_DURATION"
        fi    
    fi
fi

if [  "`which s3cmd`" != "" ]; then
    echo "test"
    if [  "`which envsubst`" != "" ]; then
        curl https://git.lab.sspcloud.fr/innovation/plateforme-onyxia/services-ressources/-/raw/master/s3cmd/.s3cfg | envsubst > $HOME/.s3cfg
    fi
fi

if [[ -n "$HADOOP_HOME" ]]; then
    echo "abort core-site.xml"
#    curl https://git.lab.sspcloud.fr/innovation/plateforme-onyxia/services-ressources/-/raw/master/hadoop/core-site.xml | envsubst > $HADOOP_HOME/etc/hadoop/core-site.xml 
fi

if [[ -e "/usr/local/lib/R/etc/" ]]; then
    echo "Renviron.site detected"
    echo -e "MC_HOST_s3=$MC_HOST_s3\nAWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID\nAWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY\nAWS_SESSION_TOKEN=$AWS_SESSION_TOKEN\nAWS_DEFAULT_REGION=$AWS_DEFAULT_REGION\nAWS_S3_ENDPOINT=$AWS_S3_ENDPOINT\nAWS_EXPIRATION=$AWS_EXPIRATION" >> /usr/local/lib/R/etc/Renviron.site
    echo -e "VAULT_ADDR=$VAULT_ADDR\nVAULT_TOKEN=$VAULT_TOKEN" >> /usr/local/lib/R/etc/Renviron.site
    echo -e "SPARK_HOME=$SPARK_HOME" >> /usr/local/lib/R/etc/Renviron.site
    echo -e "HADOOP_HOME=$HADOOP_HOME" >> /usr/local/lib/R/etc/Renviron.site
    echo -e "HADOOP_OPTIONAL_TOOLS=$HADOOP_OPTIONAL_TOOLS" >> /usr/local/lib/R/etc/Renviron.site
    echo -e "PATH=$JAVA_HOME/bin:$SPARK_HOME/bin:$HADOOP_HOME/bin:$PATH" >> /etc/environment
    echo -e "export PATH=$JAVA_HOME/bin:$SPARK_HOME/bin:$HADOOP_HOME/bin:$PATH" >> /etc/profile
    if [[ -e "/usr/lib/jvm/adoptopenjdk-8-hotspot-amd64" ]]; then
        echo -e "JAVA_HOME=/usr/lib/jvm/adoptopenjdk-8-hotspot-amd64" >> /usr/local/lib/R/etc/Renviron.site
    fi
    env | grep "KUBERNETES" >> /usr/local/lib/R/etc/Renviron.site
    env | grep "IMAGE_NAME" >> /usr/local/lib/R/etc/Renviron.site
fi

# We start by adding extra apt packages, since pip modules may required library
if [ "$EXTRA_APT_PACKAGES" ] && ["`which apt`" != ""]; then
    echo "EXTRA_APT_PACKAGES environment variable found.  Installing."
    apt update -y
    apt install -y $EXTRA_APT_PACKAGES
fi

if [ -f "/opt/app/environment.yml" ] && [ -f "/opt/conda/bin/conda"]; then
    echo "environment.yml found. Installing packages"
    /opt/conda/bin/conda env update -f /opt/app/environment.yml
else
    echo "no environment.yml"
fi

if [ "$EXTRA_CONDA_PACKAGES" ] && [ -f "/opt/conda/bin/conda"]; then
    echo "EXTRA_CONDA_PACKAGES environment variable found.  Installing."
    /opt/conda/bin/conda install -y $EXTRA_CONDA_PACKAGES
fi

if [ "$EXTRA_PIP_PACKAGES" ] && [ -f "/opt/conda/bin/pip"]; then
    echo "EXTRA_PIP_PACKAGES environment variable found.  Installing".
    /opt/conda/bin/pip install $EXTRA_PIP_PACKAGES
fi

if [[ -n "$PERSONAL_INIT_SCRIPT" ]]; then
    echo "download $PERSONAL_INIT_SCRIPT"
    curl $PERSONAL_INIT_SCRIPT | bash -s -- $PERSONAL_INIT_ARGS
fi

if [[ -e "$HOME/work" ]]; then
  if [[ $(id -u) = 0 ]]; then
    echo "cd $HOME/work" >> /etc/profile
  else
    echo "cd $HOME/work" >> $HOME/.bashrc
  fi
fi

if [ -n "$URL_INIT_SERVICE" ]; then
    wget -O - $URL_INIT_SERVICE | bash
fi

echo "execution of $@"
exec "$@"
