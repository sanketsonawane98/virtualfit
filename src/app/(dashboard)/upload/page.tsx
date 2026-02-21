import UploadForm from '@/components/upload-form'

export default function UploadPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Upload Your Photo</h1>
                <p className="text-gray-500">
                    Upload a full-body photo of yourself. Ensure good lighting and a neutral background for best results.
                </p>
            </div>

            <div className="border rounded-xl p-8 bg-white dark:bg-zinc-900 shadow-sm">
                <UploadForm />
            </div>
        </div>
    )
}
