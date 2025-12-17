// backend/students/avatar.js
import express from 'express'
import multer from 'multer'
import { supabase } from '../../supabaseClient.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post('/:userId/avatar', upload.single('avatar'), async (req, res) => {
  const { userId } = req.params
  const file = req.file

  if (!file) return res.status(400).send('No file uploaded')

  const fileExt = file.originalname.split('.').pop()
  const filePath = `student_avatars/${userId}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file.buffer, { upsert: true })

  if (uploadError) return res.status(500).send(uploadError.message)

  const { publicURL } = supabase.storage.from('avatars').getPublicUrl(filePath)

  const { error: dbError } = await supabase
    .from('student_profiles')
    .update({ avatar_url: publicURL })
    .eq('user_id', userId)

  if (dbError) return res.status(500).send(dbError.message)

  res.json({ avatar_url: publicURL })
})

export default router
