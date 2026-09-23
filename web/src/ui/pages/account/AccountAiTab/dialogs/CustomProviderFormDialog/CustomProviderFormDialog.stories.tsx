import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { Button } from "onyxia-ui/Button";
import { useEffect, useRef, useState } from "react";
import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";
import { providerTypeDefaultApiBase } from "core/usecases/aiProviderCreationFormUiController/decoupledLogic/providerTypeDefaultApiBase";
import { CustomProviderFormDialogView } from "./CustomProviderFormDialog";
import type { AiModel, FormTest, FormValues } from "./types";

type MockedProps = {
    /** Undefined to create a provider, otherwise the provider being edited. */
    editedProvider:
        | { values: FormValues; availableModels: AiModel[]; selectedModels: string[] }
        | undefined;
    /** Names of the providers that already exist, a new name has to be unique. */
    existingProviderNames: string[];
    supportedProtocols: AiConfig.SupportedAiProviderType[];
    connectionTestResult: "success" | "failure";
    submissionResult: "success" | "failure";
    /** Delay of the simulated network calls, in milliseconds. */
    latency: number;
};

/**
 * Mimics `aiProviderCreationFormUiController` so that every interaction of the dialog
 * can be tried without a core: validation, protocol prefill, connection test, model
 * selection and submission.
 */
function MockedCustomProviderFormDialog(props: MockedProps) {
    const [isOpen, setIsOpen] = useState(true);
    // Like the `open` thunk, reopening the dialog starts from a fresh form.
    const [openCount, setOpenCount] = useState(0);

    if (!isOpen) {
        return (
            <div style={{ padding: 32 }}>
                <Button
                    onClick={() => {
                        setOpenCount(openCount + 1);
                        setIsOpen(true);
                    }}
                >
                    Reopen the dialog
                </Button>
            </div>
        );
    }

    return <MockedForm key={openCount} {...props} onClose={() => setIsOpen(false)} />;
}

function MockedForm(props: MockedProps & { onClose: () => void }) {
    const {
        editedProvider,
        existingProviderNames,
        supportedProtocols,
        connectionTestResult,
        submissionResult,
        latency,
        onClose
    } = props;

    const [values, setValues] = useState<FormValues>(
        editedProvider?.values ?? { name: "", protocol: "", apiBase: "", apiKey: "" }
    );
    const [test, setTest] = useState<FormTest>(
        editedProvider === undefined
            ? { stateDescription: "idle" }
            : { stateDescription: "success", models: editedProvider.availableModels }
    );
    const [selectedModels, setSelectedModels] = useState<string[]>(
        editedProvider?.selectedModels ?? []
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSubmissionError, setHasSubmissionError] = useState(false);

    // The simulated calls resolve against the latest values, like the thunks do.
    const valuesRef = useRef(values);
    valuesRef.current = values;

    const timeoutIds = useRef<number[]>([]);

    useEffect(() => () => timeoutIds.current.forEach(clearTimeout), []);

    const simulateLatency = (callback: () => void) => {
        timeoutIds.current.push(window.setTimeout(callback, latency));
    };

    const isEditing = editedProvider !== undefined;

    const getProtocol = (protocol: string) =>
        supportedProtocols.find(supportedProtocol => supportedProtocol === protocol);

    const nameIsValid = (() => {
        const name = values.name.trim();

        return (
            name !== "" &&
            !name.includes("/") &&
            !existingProviderNames
                .filter(providerName => providerName !== editedProvider?.values.name)
                .includes(name)
        );
    })();

    const apiBaseIsValid = (() => {
        try {
            const { protocol } = new URL(values.apiBase.trim());

            return protocol === "http:" || protocol === "https:";
        } catch {
            return false;
        }
    })();

    const canTest =
        values.protocol !== "" &&
        apiBaseIsValid &&
        !isSubmitting &&
        test.stateDescription !== "testing";

    const canSave =
        nameIsValid &&
        values.protocol !== "" &&
        apiBaseIsValid &&
        !isSubmitting &&
        test.stateDescription !== "testing";

    const changeValues = (values_new: FormValues) => {
        const doesInvalidateTest = (["protocol", "apiBase", "apiKey"] as const).some(
            key => values_new[key] !== values[key]
        );

        setValues(values_new);
        setHasSubmissionError(false);

        if (doesInvalidateTest) {
            setTest({ stateDescription: "idle" });
        }
    };

    return (
        <CustomProviderFormDialogView
            isEditing={isEditing}
            values={values}
            test={test}
            selectedModels={selectedModels}
            canSave={canSave}
            canTest={canTest}
            supportedProtocols={supportedProtocols}
            hasSubmissionError={hasSubmissionError}
            nameIsValid={nameIsValid}
            apiBaseIsValid={apiBaseIsValid}
            isSubmitting={isSubmitting}
            onClose={() => {
                action("onClose")();
                onClose();
            }}
            onFieldChange={(key, value) => {
                action("onFieldChange")(key, value);
                changeValues({ ...values, [key]: value });
            }}
            onProtocolChange={protocol => {
                action("onProtocolChange")(protocol);

                const protocol_previous = getProtocol(values.protocol);

                const wasNameSuggested =
                    values.name.trim() === "" ||
                    (protocol_previous !== undefined &&
                        values.name ===
                            suggestProviderName({
                                protocol: protocol_previous,
                                existingProviderNames
                            }));

                changeValues({
                    ...values,
                    protocol,
                    apiBase: providerTypeDefaultApiBase[protocol],
                    name:
                        isEditing || !wasNameSuggested
                            ? values.name
                            : suggestProviderName({ protocol, existingProviderNames })
                });
            }}
            onTest={() => {
                action("onTest")();

                const values_tested = values;
                const protocol = getProtocol(values.protocol);

                if (protocol === undefined) {
                    return;
                }

                setTest({ stateDescription: "testing" });

                simulateLatency(() => {
                    // The user kept typing while we were "fetching": drop the result.
                    if (valuesRef.current !== values_tested) {
                        return;
                    }

                    if (connectionTestResult === "failure") {
                        setTest({ stateDescription: "error" });
                        return;
                    }

                    const models = getMockedModels(protocol);

                    setTest({ stateDescription: "success", models });
                    setSelectedModels(selectedModels =>
                        selectedModels.filter(modelId =>
                            models.some(model => model.id === modelId)
                        )
                    );
                });
            }}
            onSelectedModelsChange={models => {
                action("onSelectedModelsChange")(models);
                setSelectedModels(models);
            }}
            onSave={() => {
                action("onSave")({ values, selectedModels });

                setIsSubmitting(true);
                setHasSubmissionError(false);

                simulateLatency(() => {
                    setIsSubmitting(false);

                    if (submissionResult === "failure") {
                        setHasSubmissionError(true);
                        return;
                    }

                    onClose();
                });
            }}
        />
    );
}

const providerDisplayName: Record<AiConfig.SupportedAiProviderType, string> = {
    deepseek: "DeepSeek",
    openai: "OpenAI",
    "openai-compatible": "OpenAI Compatible",
    mistral: "Mistral",
    anthropic: "Anthropic"
};

function suggestProviderName(params: {
    protocol: AiConfig.SupportedAiProviderType;
    existingProviderNames: string[];
}): string {
    const { protocol, existingProviderNames } = params;

    const baseName = providerDisplayName[protocol];

    let suffix = 1;
    let providerName = baseName;

    while (existingProviderNames.includes(providerName)) {
        suffix += 1;
        providerName = `${baseName} ${suffix}`;
    }

    return providerName;
}

function getMockedModels(protocol: AiConfig.SupportedAiProviderType): AiModel[] {
    const modelIds = (() => {
        switch (protocol) {
            case "openai":
                return ["gpt-5", "gpt-5-mini", "gpt-4.1", "text-embedding-3-large"];
            case "anthropic":
                return ["claude-opus-4-1", "claude-sonnet-4-5", "claude-haiku-4-5"];
            case "mistral":
                return [
                    "mistral-large-latest",
                    "mistral-small-latest",
                    "codestral-latest"
                ];
            case "deepseek":
                return ["deepseek-chat", "deepseek-reasoner"];
            case "openai-compatible":
                return [
                    "gemma4-26b-moe",
                    "qwen3-6-35b-moe",
                    "qwen3-embedding-8b",
                    "qwen3-vl"
                ];
        }
    })();

    return modelIds.map(id => ({ id }));
}

const meta = {
    title: "Pages/Account/IA/CustomProviderFormDialog",
    component: MockedCustomProviderFormDialog,
    parameters: {
        layout: "fullscreen"
    },
    argTypes: {
        connectionTestResult: {
            control: "inline-radio",
            options: ["success", "failure"]
        },
        submissionResult: {
            control: "inline-radio",
            options: ["success", "failure"]
        },
        latency: {
            control: { type: "range", min: 0, max: 5000, step: 100 }
        }
    },
    args: {
        editedProvider: undefined,
        existingProviderNames: ["SSPCloud LLM", "OpenAI"],
        supportedProtocols: [
            "deepseek",
            "openai",
            "openai-compatible",
            "mistral",
            "anthropic"
        ],
        connectionTestResult: "success",
        submissionResult: "success",
        latency: 1200
    }
} satisfies Meta<typeof MockedCustomProviderFormDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Create: Story = {};

export const Edit: Story = {
    args: {
        editedProvider: {
            values: {
                name: "Custom Provider 1",
                protocol: "openai-compatible",
                apiBase: "https://llm.lab.sspcloud.fr/api",
                apiKey: "storybook-api-key"
            },
            availableModels: getMockedModels("openai-compatible"),
            selectedModels: ["gemma4-26b-moe", "qwen3-6-35b-moe"]
        },
        existingProviderNames: ["SSPCloud LLM", "Custom Provider 1"]
    }
};

export const ConnectionFailure: Story = {
    args: {
        connectionTestResult: "failure"
    }
};

export const SubmissionFailure: Story = {
    args: {
        submissionResult: "failure"
    }
};
