import { CoreAssistantMessage, CoreUserMessage } from 'ai';
import { Langfuse } from 'langfuse';
import { WorkflowBuilder } from './builder';
import { createContext } from './context';
import { createTypedEventEmitter } from './events';
import {
        analysisTask,
        plannerTask,
        refineQueryTask,
        reflectorTask,
        webSearchTask,
        writerTask
} from './tasks';

// Define the workflow schema type
export type WorkflowEventSchema = {
        flow: {
                query: string;
                threadId: string;
                threadItemId: string;
                status: "PENDING" | "COMPLETED" | "FAILED";
                goals?: Record<string, {
                        id: number;
                        text: string;
                        final: boolean;
                        status?: "PENDING" | "COMPLETED" | "FAILED";
                }>;
                steps?: Record<string, {
                        type: string;
                        final: boolean;
                        goalId?: number;
                        queries?: string[];
                        results?: {
                                title: string;
                                link: string;
                        }[];
                }>;
                reasoning?: {
                        text: string;
                        final: boolean;
                        status?: "PENDING" | "COMPLETED" | "FAILED";
                };
                answer: {
                        text: string;
                        object?: any;
                        objectType?: string;
                        final: boolean;
                        status?: "PENDING" | "COMPLETED" | "FAILED";
                };
                final: boolean;
        };
};

// Define the context schema type
export type WorkflowContextSchema = {
        question: string;
        search_queries: string[];
        messages: {
                role: "user" | "assistant";
                content: string;
        }[];
        goals: {
                id: number;
                text: string;
                final: boolean;
                status: "PENDING" | "COMPLETED" | "FAILED";
        }[];
        steps: {
                type: string;
                final: boolean;
                goalId: number;
                queries?: string[];
                results?: {
                        title: string;
                        link: string;
                }[];
        }[];
        queries: string[];
        summaries: string[];
        answer: string[];
        threadId: string;
        threadItemId: string;
};

// Replace Zod schemas with TypeScript types
const workflowEventInitialState: Partial<WorkflowEventSchema> = {
        flow: {
                query: "",
                threadId: "",
                threadItemId: "",
                status: 'PENDING',
                goals: {},
                steps: {},
                answer: {
                        text: "",
                        final: false
                },
                final: false
        }
};

export type WorkflowConfig = {
        maxIterations?: number;
        maxRetries?: number;
        timeoutMs?: number;
        retryDelayMs?: number;
        retryDelayMultiplier?: number;
};

export const deepResearchWorkflow = ({
        question, 
        threadId, 
        threadItemId,
        messages,
        config = {} // Add config parameter with default empty object
}: {
        question: string, 
        threadId: string, 
        threadItemId: string,
        messages: (CoreUserMessage | CoreAssistantMessage)[],
        config?: WorkflowConfig
}) => {
        const langfuse = new Langfuse();
        const trace = langfuse.trace({
                name: 'deep-research-workflow',
        });

        // Set default values for config
        const workflowConfig: WorkflowConfig = {
                maxIterations: 5,
                ...config
        };

        // Create typed event emitter with the proper type
        const events = createTypedEventEmitter<WorkflowEventSchema>({
                flow: {
                        query: question,
                        threadId,
                        threadItemId,
                        status: 'PENDING',
                        goals: {},
                        steps: {},
                        answer: {
                                text: "",
                                final: false,
                                status: 'PENDING'
                        },
                        final: false,
                }
        });

        const context = createContext<WorkflowContextSchema>({
                question,
                search_queries: [],
                messages: messages as any,
                goals: [],
                queries: [],
                steps: [],
                summaries: [],
                answer: [],
                threadId,
                threadItemId
        });

        // Use the typed builder
        const builder = new WorkflowBuilder({
                trace,
                initialEventState: events.getAllState().flow,
                events,
                context,
                config: workflowConfig // Pass the config to the builder
        });
        
        builder.addTasks([
                plannerTask,
                webSearchTask,
                reflectorTask,
                analysisTask,
                writerTask,
                refineQueryTask
        ]);

        return builder.build();
};
