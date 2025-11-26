import { PageHeader } from "@/components/common/PageHeader";
import { PageLayout } from "@/components/common/PageLayout";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const action = async (input: string) => {
    // Placeholder for admin action
    setOutput(`You entered: ${input}`);
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
              placeholder="Enter command"
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
          <div className="mt-4 p-4 border bg-gray-100">
            <h3 className="font-semibold mb-2">Output:</h3>
            <pre>{output}</pre>
          </div>
        )}

      </div>

    </PageLayout>
  )
}