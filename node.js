export default function handler(req, res) {
  // Здесь можно получить данные из базы или другого API
  res.status(200).json({ users: [/* ... */] });
}
