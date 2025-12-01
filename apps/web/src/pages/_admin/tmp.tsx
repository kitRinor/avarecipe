import { PageHeader } from "@/components/common/PageHeader";
import { PageLayout } from "@/components/common/PageLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";





export default function TmpPage() {

  const [input, setInput] = useState("");
  const [output, setOutput] = useState({
    url: "",
    prompt: ""
  });
  const action = async (input: string) => {
    if (input.length === 0) {
      setOutput({ url: "", prompt: "Please enter a prompt." });
      return;
    }
    const seed = Math.floor(Math.random() * 1000000);
    const url = `https://image.pollinations.ai/prompt/${input}?width=960&height=540&seed=${seed}&nologo=true`;
    setOutput({ url, prompt: input });
  }

  return (
    <PageLayout>
      <PageHeader title="Admin Panel" backBtn={false} />
      <div className="p-10">
        <div className="flex flex-row items-center justify-between gap-4 mb-4">
          <div className="w-full">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="border p-2 w-full"
              placeholder="Enter Input"
            />
          </div>
          <button
            onClick={() => action(input)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Execute
          </button>
        </div>
        {output && (
          <div className="mt-4 p-4 border bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Output:</h3>
            <div>
              <img src={output.url} alt={output.prompt} className="w-full h-auto" />
            </div>
            <pre className="whitespace-pre-line">{output.prompt}</pre>
          </div>
        )}

        

        <Button variant="default" >primary</Button>
        <Button variant="secondary" >secondary</Button>
        <Button variant="destructive" >destructive</Button>
        <Button variant="ghost" >ghost</Button>
        <Button variant="outline" >outline</Button>
        <Button variant="link" >link</Button>

        <div className="h-10 w-10 bg-vrclo1"/>
        <div className="h-10 w-10 bg-vrclo2"/>
        <div className="h-10 w-10 bg-vrclo3"/>
      </div>

    </PageLayout>
  )
}