import { useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import { AgentCreateRequest } from '../../types'

interface CreateAgentModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (agent: AgentCreateRequest) => Promise<void>
}

export function CreateAgentModal({ isOpen, onClose, onSubmit }: CreateAgentModalProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [formData, setFormData] = useState<AgentCreateRequest>({
        role: '',
        goal: '',
        backstory: '',
        max_execution_time: 300,
        max_iter: 10,
        memory_enabled: true,
        verbose: false,
        allow_delegation: false,
        tools: []
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await onSubmit(formData)
            onClose()
            // Reset form
            setFormData({
                role: '',
                goal: '',
                backstory: '',
                max_execution_time: 300,
                max_iter: 10,
                memory_enabled: true,
                verbose: false,
                allow_delegation: false,
                tools: []
            })
            setCurrentStep(1)
        } catch (error) {
            console.error('Error creating agent:', error)
            // Error will be handled by the mutation in Agents.tsx
        } finally {
            setIsSubmitting(false)
        }
    }

    const canProceedToStep2 = formData.role && formData.goal
    const canProceedToStep3 = canProceedToStep2 && formData.backstory

    return (
        <div className="macos-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="macos-modal bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-slideUp"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative px-8 pt-8 pb-6 border-b border-border/50 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Create New Agent</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Build an AI agent tailored to your needs</p>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center space-x-2 mt-6">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex items-center flex-1">
                                <div className="flex-1 flex items-center">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-300 ${step < currentStep ? 'bg-blue-500 text-white' :
                                        step === currentStep ? 'bg-blue-500 text-white ring-4 ring-blue-100' :
                                            'bg-gray-200 text-gray-400'
                                        }`}>
                                        {step < currentStep ? '✓' : step}
                                    </div>
                                    {step < 3 && (
                                        <div className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${step < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                                            }`} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-medium text-gray-500">
                        <span className={currentStep === 1 ? 'text-blue-600' : ''}>Basic Info</span>
                        <span className={currentStep === 2 ? 'text-blue-600' : ''}>Backstory</span>
                        <span className={currentStep === 3 ? 'text-blue-600' : ''}>Configuration</span>
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="px-8 py-6 overflow-y-auto max-h-[calc(85vh-280px)]">
                    {/* Step 1: Basic Info */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Agent Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="macos-input w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    autoFocus
                                >
                                    <option value="">Select a role...</option>
                                    <option value="researcher">Researcher - Gather and analyze information</option>
                                    <option value="writer">Writer - Create and edit content</option>
                                    <option value="analyst">Analyst - Analyze data and provide insights</option>
                                    <option value="coordinator">Coordinator - Manage and coordinate tasks</option>
                                    <option value="executor">Executor - Execute specific actions</option>
                                    <option value="reviewer">Reviewer - Review and validate outputs</option>
                                    <option value="custom">Custom - Define your own role</option>
                                </select>
                                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Select the primary role for your agent</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Primary Goal <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    value={formData.goal}
                                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                                    placeholder="What should this agent accomplish? Be specific about the desired outcome..."
                                    rows={4}
                                    className="macos-input resize-none"
                                />
                                <p className="mt-1.5 text-xs text-gray-500">Define what success looks like for this agent</p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Backstory */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Agent Backstory <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    value={formData.backstory}
                                    onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
                                    placeholder="Provide context about the agent's expertise, background, and approach to tasks..."
                                    rows={8}
                                    className="macos-input resize-none"
                                    autoFocus
                                />
                                <p className="mt-1.5 text-xs text-gray-500">
                                    Help the agent understand its identity and how to approach problems
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Configuration */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Max Execution Time
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.max_execution_time}
                                        onChange={(e) => setFormData({ ...formData, max_execution_time: parseInt(e.target.value) })}
                                        className="macos-input"
                                    />
                                    <p className="mt-1.5 text-xs text-gray-500">Seconds</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Max Iterations
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.max_iter}
                                        onChange={(e) => setFormData({ ...formData, max_iter: parseInt(e.target.value) })}
                                        className="macos-input"
                                    />
                                    <p className="mt-1.5 text-xs text-gray-500">Attempts</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="flex items-center space-x-3 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.memory_enabled}
                                        onChange={(e) => setFormData({ ...formData, memory_enabled: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                                    />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700">Enable Memory</span>
                                        <p className="text-xs text-gray-500 mt-0.5">Allow agent to remember past interactions</p>
                                    </div>
                                </label>

                                <label className="flex items-center space-x-3 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.verbose}
                                        onChange={(e) => setFormData({ ...formData, verbose: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                                    />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700">Verbose Output</span>
                                        <p className="text-xs text-gray-500 mt-0.5">Show detailed execution logs</p>
                                    </div>
                                </label>

                                <label className="flex items-center space-x-3 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.allow_delegation}
                                        onChange={(e) => setFormData({ ...formData, allow_delegation: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                                    />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700">Allow Delegation</span>
                                        <p className="text-xs text-gray-500 mt-0.5">Let agent delegate tasks to other agents</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-border/50 bg-gray-50/50">
                    <div className="flex justify-between items-center">
                        {currentStep > 1 ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="px-6"
                            >
                                Back
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                className="px-6"
                            >
                                Cancel
                            </Button>
                        )}

                        {currentStep < 3 ? (
                            <Button
                                type="button"
                                onClick={() => setCurrentStep(currentStep + 1)}
                                disabled={(currentStep === 1 && !canProceedToStep2) || (currentStep === 2 && !canProceedToStep3)}
                                className="px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
                            >
                                Continue
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !canProceedToStep3}
                                className="px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center space-x-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Creating...</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center space-x-2">
                                        <Sparkles className="w-4 h-4" />
                                        <span>Create Agent</span>
                                    </span>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
