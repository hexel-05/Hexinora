const {
    GoogleGenerativeAI
} = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash-lite'
});

async function analyzeReceipt(imageBuffer, mimeType = 'image/jpeg') {
    const imageBase64 = imageBuffer.toString('base64');

    const prompt = `
Kamu adalah OCR parser untuk aplikasi keuangan.

Baca nota pada gambar dan kembalikan HANYA JSON valid dengan struktur:

{
  "tanggal": null,
  "waktu": null,
  "toko": null,
  "items": [
    {
      "barang": null,
      "jumlah": 0,
      "harga": 0,
      "total": 0
    }
  ],
  "grand_total": 0
}

Aturan:
- tanggal format YYYY-MM-DD jika terlihat
- waktu format HH:mm jika terlihat
- toko = nama merchant
- barang = nama item
- jumlah = quantity
- harga = harga satuan
- total = jumlah × harga
- grand_total = total akhir nota
- semua nilai uang harus berupa angka, tanpa "Rp" atau titik
- jangan mengarang data yang tidak terlihat
- jika data tidak terbaca, gunakan null
- jangan menggunakan markdown
- jangan memberikan penjelasan
`;

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: imageBase64,
                mimeType
            }
        }
    ]);

    const text = result.response.text().trim();

    return text;
}

module.exports = {
    analyzeReceipt
};