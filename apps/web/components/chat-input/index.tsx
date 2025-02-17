import { useAgentStream } from "@/hooks/use-agent";
import { useChatEditor, useImageAttachment } from "@/lib/hooks";
import { Block, ThreadItem, useChatStore } from "@/libs/store/chat.store";
import { cn, slideUpVariant } from "@repo/shared/utils";
import { Flex } from "@repo/ui";
import { motion } from "framer-motion";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useState } from "react";
import { ChangeLogs } from "../changelogs";
import { ChatActions } from "./chat-actions";
import { ChatEditor } from "./chat-editor";
import { ChatFooter } from "./chat-footer";
import { ImageAttachment } from "./image-attachment";
import { ImageDropzoneRoot } from "./image-dropzone-root";
import { SelectedContext } from "./selected-context";

export const ChatInput = () => {
  const { editor } = useChatEditor();
  const { attachment, clearAttachment, handleImageUpload, dropzonProps } =
    useImageAttachment();
  const [openChangelog, setOpenChangelog] = useState(false);
  const threadItems = useChatStore((state) => state.threadItems);
  const createThreadItem = useChatStore((state) => state.createThreadItem);
  const updateThreadItem = useChatStore((state) => state.updateThreadItem);
  const setCurrentThreadItem = useChatStore((state) => state.setCurrentThreadItem);
  const currentThreadId = useChatStore((state) => state.currentThreadId);
  const setIsGenerating = useChatStore((state) => state.setIsGenerating);
  const { runAgent } = useAgentStream();
  const model = useChatStore((state) => state.model);
  const [responseNodesMap] = useState(() => new Map<string, Map<string, Block>>());

  useEffect(() => {
    console.log("currentThreadId", currentThreadId);
  }, [currentThreadId]);

  // Handle form submission
  const handleSubmit = (formData: FormData) => {
    const optimisticUserThreadItemId = nanoid();
    const optimisticAiThreadItemId = nanoid();
    
    // Clear previous nodes for this thread item
    responseNodesMap.set(optimisticAiThreadItemId, new Map<string, Block>());

    const userThreadItem: ThreadItem = {
      id: optimisticUserThreadItemId,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: "user" as const,
      content: [{
        id: optimisticUserThreadItemId,
        content: formData.get("query") as string,
        nodeKey: optimisticUserThreadItemId,
      }],
      status: "completed" as const,
      threadId: currentThreadId || "default",
    };

    const aiThreadItem: ThreadItem = {
      id: optimisticAiThreadItemId,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: "assistant" as const,
      content: [],
      status: "pending" as const,
      threadId: currentThreadId || "default",
    };

    createThreadItem(userThreadItem);
    createThreadItem(aiThreadItem);
    setCurrentThreadItem(userThreadItem);
    setIsGenerating(true);

    runAgent(
      {
        messages: [],
        prompt: formData.get("query") as string,
        threadId: currentThreadId || "default",
        threadItemId: optimisticAiThreadItemId,
        parentThreadItemId: optimisticUserThreadItemId
      }
    );
  }

  const onSubmit = useCallback(() => {
    if (!editor) {
      return;
    }

    const formData = new FormData();
    formData.append("query", editor.getText());
    handleSubmit(formData);
    editor.commands.clearContent();
  }, [editor, currentThreadId, model]);

  // const chatInputBackgroundContainer = cn(
  //   "absolute bottom-0 right-0 left-0 flex w-full flex-col items-center justify-end gap-2 px-4 pb-1 md:px-4",
  //   "transition-all duration-1000 ease-in-out",
  // );

  const chatContainer = cn(
    "flex flex-col items-center flex-1 w-full gap-1 md:max-w-2xl lg:max-w-2xl z-10",
  );

  const renderChatInput = () => (
    <div className="w-full rounded-2xl bg-[#F9F9F9] p-1 border">
      {/* <div className="w-full p-2.5 text-xs">
        <p className="text-secondary-foreground">
          You have 10 free messages left today.{" "}
          <a
            href="/pricing"
            className="text-teal-600 underline decoration-zinc-500/20 underline-offset-2"
          >
            Sign up
          </a>{" "}
          to continue.
        </p>
      </div> */}
      <Flex
        direction="col"
        className="w-full rounded-xl border bg-white shadow-sm dark:bg-zinc-700"
      >
        <motion.div
          variants={slideUpVariant}
          initial="initial"
          animate={editor?.isEditable ? "animate" : "initial"}
          className="flex w-full flex-shrink-0 overflow-hidden rounded-xl"
        >
          <ImageDropzoneRoot dropzoneProps={dropzonProps}>
            <Flex direction="col" className="w-full">
              <ImageAttachment
                attachment={attachment}
                clearAttachment={clearAttachment}
              />
              <Flex className="flex w-full flex-row items-end gap-0 p-3 md:pl-3">
                <ChatEditor sendMessage={() => { }} editor={editor} />
              </Flex>
              <ChatActions
                sendMessage={() => {
                  onSubmit();
                }}
                handleImageUpload={handleImageUpload}
              />
            </Flex>
          </ImageDropzoneRoot>
        </motion.div>
      </Flex>
    </div>
  );

  const renderChatBottom = () => (
    <>
      <Flex items="center" justify="center" gap="sm" className="mb-2">
        {/* <ScrollToBottomButton /> */}
      </Flex>
      <SelectedContext />
      {renderChatInput()}
    </>
  );

  return (
    <div className="flex flex-col items-center w-full">
      <Flex
        items="center"
        justify="center"
        direction="col"
        gap="sm"
        className="mb-2 h-full w-full"
      >
        {threadItems?.length === 0 && <h1 className="text-3xl font-semibold tracking-tighter text-zinc-900">
          How can I help you today?
        </h1>}
        <ChangeLogs open={openChangelog} setOpen={setOpenChangelog} />
        {renderChatBottom()}
        <ChatFooter />
      </Flex>
    </div>

  );
};
