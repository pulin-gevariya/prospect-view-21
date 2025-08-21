import React, { useState, useMemo } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Candidate {
  [key: string]: string;
}

interface CandidateDropdownProps {
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  onSelectCandidate: (candidate: Candidate | null) => void;
}

export const CandidateDropdown: React.FC<CandidateDropdownProps> = ({
  candidates,
  selectedCandidate,
  onSelectCandidate,
}) => {
  const [open, setOpen] = useState(false);

  // Create unique candidates based on Name + Email combination
  const uniqueCandidates = useMemo(() => {
    const seen = new Set();
    return candidates.filter(candidate => {
      const key = `${candidate.Name || ''}|${candidate.Email || ''}`;
      if (seen.has(key) || (!candidate.Name && !candidate.Email)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [candidates]);

  const getDisplayText = (candidate: Candidate) => {
    const name = candidate.Name || 'No Name';
    const email = candidate.Email || 'No Email';
    return `${name} (${email})`;
  };

  const getSearchText = (candidate: Candidate) => {
    return `${candidate.Name || ''} ${candidate.Email || ''}`.toLowerCase();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-surface hover:bg-surface-hover border-card-border shadow-sm transition-all duration-fast hover:border-border-hover min-h-[3rem]"
        >
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-left">
              {selectedCandidate 
                ? getDisplayText(selectedCandidate)
                : "Search candidates..."
              }
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-fast data-[state=open]:rotate-180" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 shadow-lg border-card-border" side="bottom" align="start">
        <Command className="w-full">
          <CommandInput 
            placeholder="Search by name or email..." 
            className="border-0 focus:ring-0 text-sm"
          />
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              No candidates found.
            </CommandEmpty>
            <CommandGroup>
              {uniqueCandidates.map((candidate, index) => {
                const isSelected = selectedCandidate && 
                  candidate.Name === selectedCandidate.Name && 
                  candidate.Email === selectedCandidate.Email;
                
                return (
                  <CommandItem
                    key={index}
                    value={getSearchText(candidate)}
                    onSelect={() => {
                      onSelectCandidate(isSelected ? null : candidate);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors duration-fast hover:bg-surface-hover"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">
                          {candidate.Name || 'No Name'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {candidate.Email || 'No Email'}
                        </span>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4 text-primary transition-opacity duration-fast",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};