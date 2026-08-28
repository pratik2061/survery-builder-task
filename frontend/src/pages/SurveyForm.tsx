import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import type { Survey } from "../types";
import { CheckCircle2 } from "lucide-react";

export default function SurveyForm() {
  const { id } = useParams<{ id: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    axios.get(`http://localhost:3000/api/surveys/${id}`)
      .then(res => setSurvey(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  // useMemo remembers the result of this calculation until survey or answers change.
  // This filters out questions that shouldn't be shown based on their conditional logic rules.
  const visibleQuestions = useMemo(() => {
    // If the survey hasn't loaded yet, show no questions
    if (!survey) {
      return [];
    }

    // Go through each question and decide if it should be kept
    return survey.questions.filter((question) => {
      // If the question has no conditional logic, always show it
      if (!question.conditionalLogic) {
        return true;
      }

      // Extract the rules for this question
      const dependsOnId = question.conditionalLogic.dependsOnId;
      const equalsValue = question.conditionalLogic.equalsValue;
      
      // Look up what the user answered for the dependent question
      const dependentAnswer = answers[dependsOnId];
      
      // If the dependent answer is an array (like from a checkbox), check if it includes the value
      if (Array.isArray(dependentAnswer)) {
        return dependentAnswer.includes(equalsValue);
      }
      
      // Otherwise, just compare them as strings
      return String(dependentAnswer) === equalsValue;
    });
  }, [survey, answers]);

  // This function runs whenever the user types or clicks an answer
  const handleAnswer = (questionId: string, value: any) => {
    // Update the answers object with the new value
    setAnswers((previousAnswers) => {
      return { 
        ...previousAnswers, 
        [questionId]: value 
      };
    });
    
    // If there was an error for this question, clear it because the user is fixing it
    if (errors[questionId]) {
      setErrors((previousErrors) => {
        const newErrors = { ...previousErrors };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  // Checks if the user filled out all required fields before allowing submission
  const validate = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    visibleQuestions.forEach((question) => {
      if (question.required) {
        const answer = answers[question.id];
        
        // Check if the answer is missing, empty, or an empty array
        const isMissing = answer === undefined || answer === "";
        const isEmptyArray = Array.isArray(answer) && answer.length === 0;
        
        if (isMissing || isEmptyArray) {
          newErrors[question.id] = "This question is required";
          isValid = false;
        }
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  // Runs when the user clicks the Submit button
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevents the page from refreshing
    
    if (!validate()) {
      return; // Stop if there are errors
    }
    
    // Create a new object that ONLY contains answers for the questions that are visible.
    // This prevents submitting hidden data if the user changed their mind on a conditional question.
    const finalAnswers: Record<string, any> = {};
    visibleQuestions.forEach((question) => {
      finalAnswers[question.id] = answers[question.id];
    });

    try {
      await axios.post(`http://localhost:3000/api/surveys/${id}/responses`, {
        answers: finalAnswers
      });
      toast.success("Response submitted successfully!");
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit response");
    }
  };

  if (loading) return <div className="text-center py-12">Loading survey...</div>;
  if (!survey) return <div className="text-center py-12 text-red-500">Survey not found</div>;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
          <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600">Your response has been successfully recorded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-t-2xl shadow-sm border-b-4 border-blue-600 p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{survey.title}</h1>
          {survey.description && <p className="text-gray-600 text-lg">{survey.description}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {visibleQuestions.map(q => (
            <div key={q.id} className={`bg-white rounded-xl shadow-sm p-8 transition-all ${errors[q.id] ? 'border border-red-300 ring-1 ring-red-100' : 'border border-gray-100'}`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {q.text} {q.required && <span className="text-red-500 ml-1">*</span>}
              </h3>
              
              {q.type === 'text' && (
                <input 
                  type="text" 
                  className="w-full border-b border-gray-300 focus:border-blue-600 focus:outline-none py-2 transition"
                  placeholder="Your answer"
                  value={answers[q.id] || ""}
                  onChange={e => handleAnswer(q.id, e.target.value)}
                />
              )}

              {q.type === 'single' && q.options?.map(opt => (
                <label key={opt} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition">
                  <input 
                    type="radio" 
                    name={q.id} 
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={e => handleAnswer(q.id, e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">{opt}</span>
                </label>
              ))}

              {q.type === 'multiple' && q.options?.map(opt => (
                <label key={opt} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition">
                  <input 
                    type="checkbox" 
                    value={opt}
                    checked={(answers[q.id] || []).includes(opt)}
                    onChange={e => {
                      const current = answers[q.id] || [];
                      if (e.target.checked) {
                        handleAnswer(q.id, [...current, opt]);
                      } else {
                        handleAnswer(q.id, current.filter((x: string) => x !== opt));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">{opt}</span>
                </label>
              ))}

              {q.type === 'rating' && (
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map(num => (
                    <label key={num} className="flex flex-col items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name={q.id}
                        value={num}
                        checked={Number(answers[q.id]) === num}
                        onChange={e => handleAnswer(q.id, Number(e.target.value))}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="text-gray-600">{num}</span>
                    </label>
                  ))}
                </div>
              )}

              {errors[q.id] && <p className="text-red-500 text-sm mt-3">{errors[q.id]}</p>}
            </div>
          ))}

          <div className="pt-4 pb-12">
            <button 
              type="submit" 
              className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md hover:shadow-lg"
            >
              Submit Response
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
