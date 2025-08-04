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
