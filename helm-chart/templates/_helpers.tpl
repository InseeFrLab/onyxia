{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "onyxia.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "onyxia.web.name" -}}
{{- printf "%s-%s" (include "onyxia.name" .) .Values.web.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}


{{- define "onyxia.api.name" -}}
{{- printf "%s-%s" (include "onyxia.name" .) .Values.api.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}


{{- define "onyxia.onboarding.name" -}}
{{- printf "%s-%s" (include "onyxia.name" .) .Values.onboarding.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}


{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "onyxia.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "onyxia.web.fullname" -}}
{{- printf "%s-%s" (include "onyxia.fullname" .) .Values.web.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}


{{- define "onyxia.api.fullname" -}}
{{- printf "%s-%s" (include "onyxia.fullname" .) .Values.api.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "onyxia.onboarding.fullname" -}}
{{- printf "%s-%s" (include "onyxia.fullname" .) .Values.onboarding.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "onyxia.chart" -}}
{{- printf "onyxia" -}}
{{- end -}}

{{- define "onyxia.api.chart" -}}
{{- printf "onyxia-api" -}}
{{- end -}}

{{- define "onyxia.web.chart" -}}
{{- printf "onyxia-web" -}}
{{- end -}}

{{- define "onyxia.onboarding.chart" -}}
{{- printf "onyxia-onboarding" -}}
{{- end -}}


{{/*Common labels*/}}

{{- define "onyxia.labels" -}}
helm.sh/chart: {{ include "onyxia.chart" . }}
{{ include "onyxia.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "onyxia.api.labels" -}}
helm.sh/chart: {{ include "onyxia.api.chart" . }}
{{ include "onyxia.api.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "onyxia.web.labels" -}}
helm.sh/chart: {{ include "onyxia.web.chart" . }}
{{ include "onyxia.web.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "onyxia.onboarding.labels" -}}
helm.sh/chart: {{ include "onyxia.onboarding.chart" . }}
{{ include "onyxia.onboarding.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*Selector labels*/}}
{{- define "onyxia.selectorLabels" -}}
app.kubernetes.io/name: {{ include "onyxia.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}


{{- define "onyxia.api.selectorLabels" -}}
app.kubernetes.io/name: {{ include "onyxia.api.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "onyxia.web.selectorLabels" -}}
app.kubernetes.io/name: {{ include "onyxia.web.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "onyxia.onboarding.selectorLabels" -}}
app.kubernetes.io/name: {{ include "onyxia.onboarding.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*Create the name of the service account to use*/}}

{{- define "onyxia.api.serviceAccountName" -}}
{{- if .Values.api.serviceAccount.create -}}
    {{ default (include "onyxia.api.fullname" .) .Values.api.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.api.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Fail if the removed api.serviceAccount.clusterAdmin / existingClusterRole values are still set
*/}}
{{- define "onyxia.api.rbac.checkDeprecated" -}}
{{- if or (hasKey .Values.api.serviceAccount "clusterAdmin") (hasKey .Values.api.serviceAccount "existingClusterRole") -}}
{{- fail "api.serviceAccount.clusterAdmin and api.serviceAccount.existingClusterRole have been removed. The API RBAC is now derived from api.regions[0].services; use api.roleBinding, api.clusterRole and api.clusterRoleBinding to override it." -}}
{{- end -}}
{{- end -}}

{{/*
Services of the first region, as JSON ("{}" without region). Like the rest of the chart, only the
first region is considered. Without region, the API uses its embedded default region: single
namespace with serviceAccount authentication.
*/}}
{{- define "onyxia.region.services" -}}
{{- $regions := .Values.api.regions | default list -}}
{{- $services := dict -}}
{{- if $regions -}}
{{- $services = (index $regions 0).services | default dict -}}
{{- end -}}
{{- toJson $services -}}
{{- end -}}

{{/*
"true" if the first region is multi namespace, empty otherwise.
Like the API, a region is single namespace unless singleNamespace is explicitly false.
*/}}
{{- define "onyxia.region.multiNamespace" -}}
{{- $services := include "onyxia.region.services" . | fromJson -}}
{{- if and (hasKey $services "singleNamespace") (eq (toString $services.singleNamespace) "false") -}}
true
{{- end -}}
{{- end -}}

{{/*
Authentication mode of the first region, with the same default and alias as the API.
*/}}
{{- define "onyxia.region.authenticationMode" -}}
{{- $services := include "onyxia.region.services" . | fromJson -}}
{{- $mode := $services.authenticationMode | default "serviceAccount" -}}
{{- if eq $mode "admin" -}}
serviceAccount
{{- else -}}
{{- $mode -}}
{{- end -}}
{{- end -}}

{{/*
Resolve a value that is derived from the region configuration unless explicitly set.
Returns "true" or an empty string, to be used in a condition.
Usage: include "onyxia.autoBool" (dict "value" .Values.api.roleBinding.create "auto" $auto)
*/}}
{{- define "onyxia.autoBool" -}}
{{- if kindIs "bool" .value -}}
{{- if .value -}}true{{- end -}}
{{- else if .auto -}}
true
{{- end -}}
{{- end -}}

{{/*
Onboarding: required as soon as namespaces have to be created, so only in multi namespace.
*/}}
{{- define "onyxia.onboarding.enabled" -}}
{{- include "onyxia.autoBool" (dict "value" .Values.onboarding.enabled "auto" (include "onyxia.region.multiNamespace" .)) -}}
{{- end -}}

{{/*
API RoleBinding: by default, when the API acts with its own service account on its own namespace.
*/}}
{{- define "onyxia.api.roleBinding.create" -}}
{{- $auto := and (not (include "onyxia.region.multiNamespace" .)) (eq (include "onyxia.region.authenticationMode" .) "serviceAccount") -}}
{{- include "onyxia.autoBool" (dict "value" .Values.api.roleBinding.create "auto" $auto) -}}
{{- end -}}

{{/*
API ClusterRole: by default, only to impersonate the service account of the target namespace.
*/}}
{{- define "onyxia.api.clusterRole.create" -}}
{{- $auto := eq (include "onyxia.region.authenticationMode" .) "serviceAccountInTargetNamespace" -}}
{{- include "onyxia.autoBool" (dict "value" .Values.api.clusterRole.create "auto" $auto) -}}
{{- end -}}

{{/*
API ClusterRoleBinding: by default, to impersonate the service account of the target namespace, or
when the API acts with its own service account on several namespaces (cluster-admin).
*/}}
{{- define "onyxia.api.clusterRoleBinding.create" -}}
{{- $mode := include "onyxia.region.authenticationMode" . -}}
{{- $auto := or (eq $mode "serviceAccountInTargetNamespace") (and (include "onyxia.region.multiNamespace" .) (eq $mode "serviceAccount")) -}}
{{- include "onyxia.autoBool" (dict "value" .Values.api.clusterRoleBinding.create "auto" $auto) -}}
{{- end -}}

{{/*
Fail rather than silently granting cluster-admin to the API: without authenticationMode, a multi
namespace region uses the API service account. Explicitly setting the mode or the binding is enough.
*/}}
{{- define "onyxia.api.rbac.checkMultiNamespaceMode" -}}
{{- if and .Values.api.enabled (include "onyxia.region.multiNamespace" .) -}}
{{- $services := include "onyxia.region.services" . | fromJson -}}
{{- if not (or $services.authenticationMode (kindIs "bool" .Values.api.clusterRoleBinding.create)) -}}
{{- fail "api.regions[0].services.authenticationMode is required when singleNamespace is false. Use serviceAccountInTargetNamespace (recommended) or serviceAccount (grants cluster-admin to the API)." -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "onyxia.api.clusterRoleName" -}}
{{- default (include "onyxia.api.fullname" .) .Values.api.clusterRole.name -}}
{{- end -}}

{{/*
Resolve the ClusterRole referenced by an api binding.
Priority: explicit clusterRoleName > ClusterRole created by the chart > provided fallback.
Usage: include "onyxia.api.rbac.roleRefName" (dict "binding" .Values.api.roleBinding "fallback" "admin" "context" $)
*/}}
{{- define "onyxia.api.rbac.roleRefName" -}}
{{- if .binding.clusterRoleName -}}
{{- .binding.clusterRoleName -}}
{{- else if include "onyxia.api.clusterRole.create" .context -}}
{{- include "onyxia.api.clusterRoleName" .context -}}
{{- else -}}
{{- .fallback -}}
{{- end -}}
{{- end -}}

{{- define "onyxia.web.serviceAccountName" -}}
{{- if .Values.web.serviceAccount.create -}}
    {{ default (include "onyxia.web.fullname" .) .Values.web.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.web.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{- define "onyxia.onboarding.serviceAccountName" -}}
{{- if .Values.onboarding.serviceAccount.create -}}
    {{ default (include "onyxia.onboarding.fullname" .) .Values.onboarding.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.onboarding.serviceAccount.name }}
{{- end -}}
{{- end -}}
