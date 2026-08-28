import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import type { Question, QuestionType } from "../types";
import { Trash2, ChevronUp, ChevronDown, Plus, Save } from "lucide-react";

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function SurveyBuilder() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Adds a new question to the end of the survey
  const addQuestion = (type: QuestionType) => {
    // We create a new question object with default values
    const newQuestion: Question = {
      id: generateId(),
      type: type,
      text: "",
      required: false,
      // If it's a multiple choice type, give it one empty option to start with
      options: (type === 'single' || type === 'multiple') ? ["Option 1"] : []
    };
    
    // Add it to our existing list of questions
    setQuestions([...questions, newQuestion]);
  };

  // Updates a specific property (like text or required) for one question
  const updateQuestion = (index: number, updates: Partial<Question>) => {
    // Create a copy of the array so we don't mutate state directly
    const newQuestions = [...questions];
    
    // Merge the old question data with the new updates
    newQuestions[index] = { ...newQuestions[index], ...updates };
    
    setQuestions(newQuestions);
  };

  // Removes a question from the list
  const removeQuestion = (index: number) => {
    const newQuestions = [...questions];
    const removedId = newQuestions[index].id;
    
    // Remove the question at this index
    newQuestions.splice(index, 1);
    
    // We must also remove any conditional logic that depended on this deleted question
    newQuestions.forEach((question, i) => {
      if (question.conditionalLogic?.dependsOnId === removedId) {
        newQuestions[i].conditionalLogic = undefined;
      }
    });
    
    setQuestions(newQuestions);
  };

  // Moves a question up or down in the list
  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    // Prevent moving the first item up, or the last item down
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;
    
    const newQuestions = [...questions];
    
    // Calculate the index of the item we are swapping with
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap the two items
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[swapIndex];
    newQuestions[swapIndex] = temp;
    
    setQuestions(newQuestions);
  };

  // Saves the survey to the backend database
  const handleSave = async () => {
    // Basic validation before sending to the server
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (questions.length === 0) {
      toast.error("Add at least one question");
      return;
    }
    
    // Make sure no question text is left blank
    const hasEmptyQuestions = questions.some(q => !q.text.trim());
    if (hasEmptyQuestions) {
      toast.error("All questions must have text");
      return;
    }

    setIsSubmitting(true);
    try {
      // Send a POST request to our Express backend
      await axios.post("http://localhost:3000/api/surveys", {
        title: title, 
        description: description, 
        questions: questions
      });
      
      // If successful, redirect the user back to the admin dashboard
      toast.success("Survey created successfully!");
      navigate(`/admin`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save survey");
    } finally {
      setIsSubmitting(false); // Re-enable the save button
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Survey Builder</h1>
        <button 
          onClick={handleSave}
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm disabled:opacity-50"
        >
          <Save size={20} /> {isSubmitting ? "Saving..." : "Save Survey"}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8 border-t-4 border-t-blue-500">
        <input 
          type="text" 
          placeholder="Survey Title" 
          className="w-full text-3xl font-bold text-gray-900 border border-gray-200 bg-gray-50 focus:bg-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 mb-4 transition-colors"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea 
          placeholder="Survey Description (optional)" 
          className="w-full text-gray-700 border border-gray-200 bg-gray-50 focus:bg-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 resize-none min-h-[100px] transition-colors"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        {questions.map((q, i) => (
          <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex gap-4 transition-all focus-within:ring-2 focus-within:ring-blue-100">
            <div className="flex flex-col items-center justify-center gap-2 text-gray-400 bg-gray-50 rounded-lg p-2 border border-gray-100 h-fit">
              <button onClick={() => moveQuestion(i, 'up')} disabled={i===0} className="hover:text-blue-600 hover:bg-blue-50 p-1 rounded transition disabled:opacity-20 disabled:hover:bg-transparent"><ChevronUp size={20} /></button>
              <span className="text-xs font-bold text-gray-500">{i + 1}</span>
              <button onClick={() => moveQuestion(i, 'down')} disabled={i===questions.length-1} className="hover:text-blue-600 hover:bg-blue-50 p-1 rounded transition disabled:opacity-20 disabled:hover:bg-transparent"><ChevronDown size={20} /></button>
            </div>
            
            <div className="flex-1">
              <div className="flex gap-4 mb-4">
                <input 
                  type="text" 
                  placeholder="Question text" 
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={q.text}
                  onChange={e => updateQuestion(i, { text: e.target.value })}
                />
                <select 
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={q.type}
                  onChange={e => updateQuestion(i, { type: e.target.value as QuestionType })}
                >
                  <option value="text">Text Input</option>
                  <option value="single">Single Choice</option>
                  <option value="multiple">Multiple Choice</option>
                  <option value="rating">Rating (1-5)</option>
                </select>
              </div>

              {(q.type === 'single' || q.type === 'multiple') && (
                <div className="pl-4 space-y-2 mb-4">
                  {q.options?.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <div className={`w-4 h-4 border border-gray-300 ${q.type === 'single' ? 'rounded-full' : 'rounded'}`} />
                      <input 
                        type="text" 
                        value={opt}
                        onChange={e => {
                          const newOpts = [...(q.options || [])];
                          newOpts[optIndex] = e.target.value;
                          updateQuestion(i, { options: newOpts });
                        }}
                        className="flex-1 border-b border-gray-200 focus:border-blue-500 focus:outline-none px-2 py-1 text-sm"
                      />
                      <button 
                        onClick={() => {
                          const newOpts = [...(q.options || [])];
                          newOpts.splice(optIndex, 1);
                          updateQuestion(i, { options: newOpts });
                        }}
                        className="text-gray-400 hover:text-red-500"
                      ><Trash2 size={16} /></button>
                    </div>
                  ))}
                  <button 
                    onClick={() => updateQuestion(i, { options: [...(q.options || []), `Option ${(q.options?.length||0) + 1}`] })}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-2"
                  ><Plus size={16} /> Add option</button>
                </div>
              )}

              {/* Conditional Logic UI */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">Conditional Logic</span>
                  <label className="flex items-center gap-2 text-sm text-blue-800 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={!!q.conditionalLogic}
                      onChange={e => {
                        if (e.target.checked) {
                          const prevQs = questions.slice(0, i);
                          const dependsOn = prevQs.length > 0 ? prevQs[0].id : "";
                          updateQuestion(i, { conditionalLogic: { dependsOnId: dependsOn, equalsValue: "" } });
                        } else {
                          updateQuestion(i, { conditionalLogic: undefined });
                        }
                      }}
                    /> Enable
                  </label>
                </div>
                {q.conditionalLogic && (
                  <div className="flex gap-2 text-sm mt-2 items-center">
                    <span>Show if</span>
                    <select 
                      className="border border-blue-200 rounded px-2 py-1 bg-white"
                      value={q.conditionalLogic.dependsOnId}
                      onChange={e => updateQuestion(i, { conditionalLogic: { ...q.conditionalLogic!, dependsOnId: e.target.value } })}
                    >
                      <option value="" disabled>Select Question</option>
                      {questions.slice(0, i).map(prev => (
                        <option key={prev.id} value={prev.id}>Q: {prev.text}</option>
                      ))}
                    </select>
                    <span>equals</span>
                    <input 
                      type="text" 
                      className="border border-blue-200 rounded px-2 py-1 bg-white"
                      placeholder="Value"
                      value={q.conditionalLogic.equalsValue}
                      onChange={e => updateQuestion(i, { conditionalLogic: { ...q.conditionalLogic!, equalsValue: e.target.value } })}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={q.required}
                    onChange={e => updateQuestion(i, { required: e.target.checked })}
                    className="rounded text-blue-600"
                  /> Required
                </label>
                <button onClick={() => removeQuestion(i)} className="text-red-500 hover:bg-red-50 p-2 rounded transition">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-4 justify-center">
        <button onClick={() => addQuestion('text')} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium">Add Text</button>
        <button onClick={() => addQuestion('single')} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium">Add Single Choice</button>
        <button onClick={() => addQuestion('multiple')} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium">Add Multiple Choice</button>
        <button onClick={() => addQuestion('rating')} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium">Add Rating</button>
      </div>
    </div>
  );
}
