#!/bin/bash

echo -e "AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID\nAWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY\nAWS_SESSION_TOKEN=$AWS_SESSION_TOKEN\nAWS_DEFAULT_REGION=$AWS_DEFAULT_REGION\nAWS_S3_ENDPOINT=$AWS_S3_ENDPOINT\nAWS_EXPIRATION=$AWS_EXPIRATION" >> /usr/local/lib/R/etc/Renviron.site
echo -e "JAVA_HOME=/usr/lib/jvm/adoptopenjdk-8-hotspot-amd64" >> /usr/local/lib/R/etc/Renviron.site
echo -e "SPARK_HOME=$SPARK_HOME" >> /usr/local/lib/R/etc/Renviron.site
echo -e "HADOOP_HOME=$HADOOP_HOME" >> /usr/local/lib/R/etc/Renviron.site
echo -e "HADOOP_OPTIONAL_TOOLS=$HADOOP_OPTIONAL_TOOLS" >> /usr/local/lib/R/etc/Renviron.site
echo -e "PATH=$JAVA_HOME/bin:$SPARK_HOME/bin:$HADOOP_HOME/bin:$PATH" >> /etc/environment
echo -e "export PATH=$JAVA_HOME/bin:$SPARK_HOME/bin:$HADOOP_HOME/bin:$PATH" >> /etc/profile