/*
 * ============================================================
 * script.js — Study Application Client-Side Scripts (CS340)
 * Group 69 — Sasan Pourassef & Jeremy Dempsey
 * Oregon State University
 *
 * Description:
 *   This file contains client-side JavaScript functionality
 *   for the Study Application. It handles:
 *     • RESET button functionality with fetch API
 *     • Form validation and user interactions
 *     • Dynamic page refreshing after database operations
 *     • Alert notifications for user feedback
 *
 * Purpose:
 *   This script enhances the user experience by providing:
 *     1) Asynchronous database reset without full page redirect
 *     2) Success/error notifications via alerts
 *     3) Current page refresh after RESET operation
 *     4) Client-side validation and interaction handling
 *
 * Sources:
 *   • This file was created based on standard JavaScript
 *     practices and customized for the Study Application.
 *
 * ============================================================
 */

// Set today's date as default for date inputs
document.addEventListener('DOMContentLoaded', function() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];

    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
});

// Form validation helper
function validateForm(formID) {
    const form = document.getElementById(formID);
    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    };

    return true;
};

// Show confirmation dialog for destructive actions
function confirmAction(message) {
    return confirm(message || 'Are you sure you want to proceed?');
}

// Display success message
function showSuccessMessage(message) {
    alert(message);
}

// Display error message
function showErrorMessage(message) {
    alert('Error: ' + message);
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Handle DELETE button clicks
document.addEventListener('DOMContentLoaded', function() {
    const deleteForms = document.querySelectorAll('.delete-form');
    
    deleteForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); // Stop the form from submitting normally
            
            const confirmDelete = confirm('Are you sure you want to delete this item?');
            if (!confirmDelete) return;
            
            // Get form action URL
            const url = form.action;
            
            // Send DELETE request
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(response => {
                if (response.ok || response.status === 204) {
                    alert('✅ Item deleted successfully!');
                    window.location.reload(); // Reload the page
                } else {
                    alert('❌ Error deleting item. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('❌ Error deleting item. Please try again.');
            });
        });
    });
});