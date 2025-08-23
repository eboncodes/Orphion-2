import React from 'react'
import InfoBlocks from './InfoBlocks'

const InfoBlocksExample: React.FC = () => {
  const cellWallBlocks = [
    {
      id: '1',
      content: '- Rigid layer for structure and protection.'
    },
    {
      id: '2', 
      content: '- Made of **cellulose** in plants.'
    }
  ]

  return (
    <div className="p-6">
      <InfoBlocks 
        title="10. Cell Wall (in plants/fungi)"
        blocks={cellWallBlocks}
      />
    </div>
  )
}

export default InfoBlocksExample 