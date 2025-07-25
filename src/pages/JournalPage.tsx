// Fichier temporaire pour corriger les erreurs TypeScript
import { useRef, RefObject } from 'react';
import type { FC, RefObject } from 'react';
import { Dumbbell, Flame, Trophy, Clock } from 'lucide-react';

interface ShareJournalProps {
  containerRef: RefObject<HTMLDivElement>;
}

const ShareJournal = ({ containerRef }) => {
  return <div>Journal partagé</div>;
};

const JournalPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <h1>Journal Page</h1>
      <div>
        <Dumbbell className="w-5 h-5" />
        <Flame className="w-5 h-5" />
        <Trophy className="w-5 h-5" />
        <Clock className="w-5 h-5 text-primary" />
      </div>
      <ShareJournal containerRef={containerRef} />
    </div>
  );
};

export default JournalPage;

