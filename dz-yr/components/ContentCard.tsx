type Props = {
    item: any
    canView: boolean
    onOpen: () => void
  }
  
  export default function ContentCard({ item, canView, onOpen }: Props) {
    return (
      <div className="p-3 bg-zinc-800 rounded-lg text-white shadow-md">
        <div className="font-bold italic text-sm">{item.title}</div>
        <div className="text-sm mt-1">{item.description}</div>
        <div className="flex justify-between items-center mt-2 text-xs text-gray-300">
          <span>💬 {item.comments}</span>
          <span>❤️ {item.likes}</span>
        </div>
        {canView && (
          <div className="mt-3 text-center">
            <button
              onClick={onOpen}
              className="bg-white text-black text-sm px-4 py-1 rounded hover:bg-gray-200"
            >
              OPEN
            </button>
          </div>
        )}
      </div>
    )
  }
  