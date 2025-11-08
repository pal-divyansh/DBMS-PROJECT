const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Report a new water issue
const reportIssue = async (req, res) => {
  try {
    const { title, description, location, priority, images } = req.body;
    const userId = req.user.id;

    const issue = await prisma.waterIssue.create({
      data: {
        title,
        description,
        location,
        priority: priority || "MEDIUM",
        userId,
        images: images || [],
      },
    });

    res.status(201).json({
      message: "Issue reported successfully",
      issue,
    });
  } catch (error) {
    console.error("Error reporting issue:", error);
    res.status(500).json({ error: "Failed to report issue" });
  }
};

// Get all water issues (for admin/staff)
const getIssues = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }

    if (req.user.role === "STUDENT") {
      where.userId = req.user.id;
    } else if (req.user.role === "PLUMBER") {
      where.OR = [{ plumberId: req.user.id }, { status: "PENDING" }];
    }

    const issues = await prisma.waterIssue.findMany({
      where,
      include: {
        reportedBy: {
          select: { name: true, email: true, roomNo: true },
        },
        assignedTo: {
          select: { name: true, email: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(issues);
  } catch (error) {
    console.error("Error fetching issues:", error);
    res.status(500).json({ error: "Failed to fetch issues" });
  }
};

// Update issue status (for admin/plumber)
const updateIssueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, plumberId } = req.body;
    const user = req.user;

    const issue = await prisma.waterIssue.findUnique({
      where: { id: parseInt(id) },
    });

    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    // Only admin can assign plumbers
    const updateData = { status };
    if (plumberId && user.role === "ADMIN") {
      updateData.plumberId = parseInt(plumberId);
    }

    const updatedIssue = await prisma.waterIssue.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        reportedBy: {
          select: { name: true, email: true, roomNo: true },
        },
        assignedTo: {
          select: { name: true, email: true },
        },
      },
    });

    res.json(updatedIssue);
  } catch (error) {
    console.error("Error updating issue:", error);
    res.status(500).json({ error: "Failed to update issue" });
  }
};

// Export the functions as an object
module.exports = {
  reportIssue,
  getIssues,
  updateIssueStatus,
};
