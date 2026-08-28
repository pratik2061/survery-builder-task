import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import type { Survey, Response } from "../types";
import { ArrowLeft, Users, FileText } from "lucide-react";

export default function SurveyAnalytics() {
  const { id } = useParams<{ id: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`http://localhost:3000/api/surveys/${id}/analytics`)
      .then(res => {
        setSurvey(res.data.survey);
        setResponses(res.data.responses);
        setTotal(res.data.totalResponses);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-12">Loading analytics...</div>;
  if (!survey) return <div className="text-center py-12 text-red-500">Survey not found</div>;

  return (
    <div>
      <div className="mb-8">
        <Link to="/admin" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition mb-4">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{survey.title} - Analytics</h1>
        <div className="flex gap-6 mt-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 min-w-[200px]">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Responses</p>
              <p className="text-3xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {survey.questions.map((question, index) => {
          
          // --- For Text Questions ---
          // We just collect all the text answers and show them in a list
          if (question.type === 'text') {
            // Get all answers for this specific question, and remove any blank ones (using Boolean)
            const answers = responses.map(r => r.answers[question.id]).filter(Boolean);
            
            return (
              <div key={question.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">{index+1}. {question.text}</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {answers.length === 0 ? (
                    <p className="text-gray-400 text-sm">No responses yet.</p>
                  ) : (
                    answers.map((ans, i) => (
                      <div key={i} className="bg-gray-50 p-3 rounded text-sm text-gray-700 flex gap-3">
                        <FileText size={16} className="text-gray-400 shrink-0 mt-0.5" />
                        {ans}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          }
          
          // --- For Rating Questions ---
          // We calculate the average rating out of 5
          if (question.type === 'rating') {
            // Extract the numbers, filtering out anything that isn't a valid number
            const answers = responses.map(r => Number(r.answers[question.id])).filter(n => !isNaN(n));
            
            // Calculate average: sum all ratings and divide by how many there are
            let sum = 0;
            answers.forEach(num => { sum += num; });
            const average = answers.length > 0 ? (sum / answers.length).toFixed(1) : "0.0";
            
            return (
              <div key={question.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">{index+1}. {question.text}</h3>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-blue-600">{average}</div>
                  <div className="text-sm text-gray-500">Average Rating<br/>(out of 5)</div>
                </div>
              </div>
            );
          }

          // --- For Single and Multiple Choice Questions ---
          // We count how many times each option was selected
          if (question.type === 'single' || question.type === 'multiple') {
            // Initialize a tally dictionary with all options set to 0
            const counts: Record<string, number> = {};
            question.options?.forEach(opt => {
              counts[opt] = 0;
            });
            
            // Go through every user's response
            responses.forEach(r => {
              const answer = r.answers[question.id];
              
              if (Array.isArray(answer)) {
                // If it's a multiple choice (array), increment tally for each selected option
                answer.forEach(selection => {
                  if (counts[selection] !== undefined) {
                    counts[selection] += 1;
                  }
                });
              } else if (answer && counts[answer] !== undefined) {
                // If it's single choice, increment tally for that one option
                counts[answer] += 1;
              }
            });

            return (
              <div key={question.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">{index+1}. {question.text}</h3>
                <div className="space-y-3">
                  {question.options?.map(opt => {
                    const count = counts[opt];
                    // Calculate percentage so we can draw a progress bar
                    const percent = total > 0 ? (count / total) * 100 : 0;
                    
                    return (
                      <div key={opt}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{opt}</span>
                          <span className="text-gray-500">{count} ({percent.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            );
          }
          
          return null;
        })}
      </div>
    </div>
  );
}
