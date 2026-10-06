import { Box, Divider, Typography } from '@mui/material';
import DraftsOutlinedIcon from '@mui/icons-material/DraftsOutlined';
export function EmailPreview({ recipient, subject, body }: { recipient: string; subject: string; body: string }) {
  return <Box sx={{ bgcolor: 'white', border: '1px solid #e3e6dd', borderRadius: 3, overflow: 'hidden' }}>
    <Box sx={{ px: 3, py: 2, bgcolor: '#f3f5ef', display: 'flex', gap: 1, alignItems: 'center' }}><DraftsOutlinedIcon fontSize="small" /><Typography variant="h4">Email preview</Typography></Box>
    <Box sx={{ p: { xs: 2.5, md: 3.5 } }}><Typography variant="body2"><strong>To:</strong> {recipient || 'Add a teacher’s email to open your email app'}</Typography><Typography variant="body2" sx={{ mt: 1 }}><strong>Subject:</strong> {subject}</Typography><Divider sx={{ my: 2.5 }} /><Box component="pre" className="email-preview">{body}</Box></Box>
  </Box>;
}
