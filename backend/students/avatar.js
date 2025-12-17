const express = require('express');
const multer = require('multer');
const { supabase, supabaseService } = require('../supabaseClient.js');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/:studentId/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    console.log('studentId type:', typeof studentId, 'value:', studentId);

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const fileExt = file.originalname.split('.').pop();
    const filePath = `student_avatars/${studentId}.${fileExt}`;

    // Upload naar Supabase Storage
    const { error: uploadError } = await supabaseService.storage
      .from('avatars')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseService.storage.from('avatars').getPublicUrl(filePath);

    // test log
    const { data: testData, error: testError } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', studentId);
    console.log('Test select:', testData, testError);

    // Update student_profiles tabel
    const { data: updatedRows, error: dbError } = await supabase
      .from('student_profiles')
      .upsert(
        { id: studentId, avatar_url: publicUrl }
      )
      .select();

    if (dbError) throw dbError;

    console.log('Updated row:', updatedRows?.[0]);
    res.json({ avatar_url: publicUrl });


  } catch (err) {
    console.error('Error uploading avatar:', err);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

router.get('/:studentId/avatar', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);

    const { data: profile, error } = await supabase
      .from('student_profiles')
      .select('avatar_url')
      .eq('id', studentId)
      .single();

    if (error || !profile) return res.status(404).json({ error: 'Avatar not found' });

    res.json({ avatar_url: profile.avatar_url });
  } catch (err) {
    console.error('Error fetching avatar:', err);
    res.status(500).json({ error: 'Failed to fetch avatar' });
  }
});



module.exports = router;
