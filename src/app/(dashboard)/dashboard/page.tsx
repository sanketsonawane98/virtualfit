export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p>Welcome to VirtualFit. Upload a photo to get started, or browse our catalog.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 border rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-2">Upload Photo</h3>
                    <p className="text-sm text-gray-500 mb-4">Upload your full-body photo for try-ons.</p>
                    <a href="/upload" className="text-blue-600 hover:underline">Go to Upload &rarr;</a>
                </div>
                <div className="p-6 border rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-2">Browse Catalog</h3>
                    <p className="text-sm text-gray-500 mb-4">Choose from our collection of clothes.</p>
                    <a href="/products" className="text-blue-600 hover:underline">View Catalog &rarr;</a>
                </div>
                <div className="p-6 border rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-2">Your Gallery</h3>
                    <p className="text-sm text-gray-500 mb-4">See your previous virtual try-ons.</p>
                    <a href="/gallery" className="text-blue-600 hover:underline">View Gallery &rarr;</a>
                </div>
            </div>
        </div>
    )
}
