const express = require('express');
const { verifyAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/requestController');

const router = express.Router();

// Officers approve / reject.
router.post('/:id/approve', verifyAuth, requireRole('gso2', 'admin', 'depthead'), ctrl.approve);
router.post('/:id/reject',  verifyAuth, requireRole('gso2', 'admin', 'depthead'), ctrl.reject);

// The owning student records arrival.
router.post('/:id/arrival', verifyAuth, requireRole('student'), ctrl.arrival);

module.exports = router;
