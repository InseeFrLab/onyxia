/* NOTE: ChatGPTd */

import { promisify } from 'util';
import { pipeline } from 'stream';
import { createWriteStream } from 'fs';
import fetch from "node-fetch";
import { exec } from 'child_process';

const execAsync = promisify(exec);
const pipelineAsync = promisify(pipeline);

export async function installHelm() {
  // Determine the version you want to install
  const helmVersion = 'v3.18.4';

  // Download Helm binary
  const downloadUrl = `https://get.helm.sh/helm-${helmVersion}-linux-amd64.tar.gz`;
  const response = await fetch(downloadUrl);

  if (!response.ok) {
    throw new Error(`Failed to download Helm: ${response.statusText}`);
  }

  const tarPath = '/tmp/helm.tar.gz';
  await pipelineAsync(response.body, createWriteStream(tarPath));

  // Extract the binary
  await execAsync(`tar -zxvf ${tarPath} -C /tmp`);

  // Move helm to a directory in PATH
  await execAsync('sudo mv /tmp/linux-amd64/helm /usr/local/bin/helm');

  // Make it executable
  await execAsync('sudo chmod +x /usr/local/bin/helm');

  // Verify the installation
  const { stdout } = await execAsync('helm version --short');
  console.log(`Helm installed: ${stdout}`);
}





