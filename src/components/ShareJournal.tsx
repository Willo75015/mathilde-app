import React from 'react';

interface ShareJournalProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

const ShareJournal = ({ containerRef }) => {
  return (
    <div ref={containerRef}>
      <p>Partage du journal</p>
    </div>
  );
};

export default ShareJournal;

