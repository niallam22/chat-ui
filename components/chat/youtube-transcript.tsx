import { ChatbotUIContext } from "@/context/context"
import { Copy, Expand, Minimize } from "lucide-react"
import { FC, useContext, useState } from "react"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"

interface YoutubeTranscriptProps {}

export const YoutubeTranscript: FC<YoutubeTranscriptProps> = ({}) => {
  const { youtubeTranscription } = useContext(ChatbotUIContext)
  const [isOpen, setIsOpen] = useState(false)

  const [isExpanded, setIsExpanded] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const handleOpenChange = (isOpen: boolean) => {
    setIsOpen(isOpen)
  }

  const handleCopyToClipboard = () => {
    if (youtubeTranscription) {
      navigator.clipboard.writeText(youtubeTranscription)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  if (youtubeTranscription && !isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="mt-2"
      >
        View YouTube Transcript
      </Button>
    )
  }

  return (
    <>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogContent
            className={`flex flex-col ${isExpanded ? "max-h-[80vh]" : "max-h-[50vh]"}`}
          >
            <DialogHeader>
              <DialogTitle>YouTube Transcript</DialogTitle>
            </DialogHeader>

            <div
              className={`mt-2 overflow-y-auto flex-grow ${isExpanded ? "h-[60vh]" : "h-[35vh]"} bg-secondary/20 rounded-md`}
            >
              <pre className="whitespace-pre-wrap text-sm p-4">
                {youtubeTranscription || "No transcript available."}
              </pre>
            </div>

            <div className="mt-2 flex justify-end space-x-2">
              <Button variant="ghost" size="sm" onClick={toggleExpand}>
                {isExpanded ? (
                  <>
                    <Minimize className="h-4 w-4 mr-2" /> Collapse
                  </>
                ) : (
                  <>
                    <Expand className="h-4 w-4 mr-2" /> Expand
                  </>
                )}
              </Button>

              <Button
                size="sm"
                onClick={handleCopyToClipboard}
                disabled={!youtubeTranscription || isCopied}
              >
                <Copy className="h-4 w-4 mr-2" />
                {isCopied ? "Copied!" : "Copy to Clipboard"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
