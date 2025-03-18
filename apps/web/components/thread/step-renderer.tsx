import { Step } from '@/libs/store/chat.store';
import { Badge } from '@repo/ui';
import { IconSearch } from '@tabler/icons-react';
import { SearchResultsList } from '../search-results';
export type StepRendererType = {
  step: Step;
}
export const StepRenderer = ({
  step
}: StepRendererType) => {

  if (step.type === 'search') {
    return <div className='flex flex-col gap-1 my-1'>
      <div className='flex flex-inline flex-row gap-1 flex-wrap'>
      <p className='text-sm text-muted-foreground'>Searching for...</p>

        {step.queries?.map((query, index) => (
          <Badge key={index} className="gap-1 rounded-md px-2 py-0.5 text-xs font-normal">
            <IconSearch size={12} className="opacity-50" />
            {query}
          </Badge>
        ))}
      </div>
    </div>
  }

  if (step.type === 'read') {
    return <div className='flex flex-col gap-1 my-1'>
      <p className='text-xs text-muted-foreground'>Reading</p>
      <SearchResultsList results={step.results || []} />
    </div>
  }

  return null;
}
