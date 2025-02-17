import { SettingsTabs } from '@/components/layout/settings-tabs';
import { TopNav } from '@/components/layout/top-nav';
import { Flex } from '@repo/ui';

export const SettingsTopNav = () => {
  return (
    <Flex direction="col" className="w-full">
      <TopNav title="Settings" showBackButton borderBottom={false} />
      <Flex direction="row" className="bg-zinc-25 w-full border-b px-2 pt-0 dark:bg-zinc-800">
        <SettingsTabs />
      </Flex>
    </Flex>
  );
};
