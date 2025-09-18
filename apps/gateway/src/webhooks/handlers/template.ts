import type { Request, Response } from 'express';

export interface TemplateEvent {
    id: string;
    name: string;
    status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISABLED' | 'PAUSED';
    category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
    language: string;
    quality_score?: {
        score: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';
        date: string;
    };
    rejected_reason?: string;
    components?: Array<{
        type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
        format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
        text?: string;
        example?: {
            header_text?: string[];
            body_text?: string[][];
        };
    }>;
}

export interface TemplateWebhookData {
    messaging_product: 'whatsapp';
    metadata: {
        display_phone_number: string;
        phone_number_id: string;
    };
    event: 'template_status_update';
    template: TemplateEvent;
}

export const handleTemplateEvent = async (req: Request, res: Response) => {
    try {
        const webhookData: TemplateWebhookData = req.body;

        console.log('📋 Processing template event:', {
            phoneNumberId: webhookData.metadata.phone_number_id,
            templateId: webhookData.template.id,
            templateName: webhookData.template.name,
            status: webhookData.template.status
        });

        await processTemplateUpdate(webhookData.template, webhookData.metadata);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('❌ Error processing template event:', error);
        res.status(500).json({ error: 'Failed to process template event' });
    }
};

const processTemplateUpdate = async (template: TemplateEvent, metadata: TemplateWebhookData['metadata']) => {
    const statusEmoji = getTemplateStatusEmoji(template.status);

    console.log(`${statusEmoji} Template update:`, {
        templateId: template.id,
        templateName: template.name,
        status: template.status,
        category: template.category,
        language: template.language,
        qualityScore: template.quality_score?.score,
        rejectedReason: template.rejected_reason
    });

    // Handle different template statuses
    switch (template.status) {
        case 'APPROVED':
            await handleTemplateApproved(template);
            break;
        case 'REJECTED':
            await handleTemplateRejected(template);
            break;
        case 'DISABLED':
            await handleTemplateDisabled(template);
            break;
        case 'PENDING':
            await handleTemplatePending(template);
            break;
        case 'PAUSED':
            await handleTemplatePaused(template);
            break;
    }

    // TODO: Implement template update logic
    // - Update template status in database
    // - Notify administrators of status changes
    // - Update template usage permissions
    // - Sync with template management system
};

const getTemplateStatusEmoji = (status: TemplateEvent['status']): string => {
    switch (status) {
        case 'APPROVED': return '✅';
        case 'PENDING': return '⏳';
        case 'REJECTED': return '❌';
        case 'DISABLED': return '🚫';
        case 'PAUSED': return '⏸️';
        default: return '📋';
    }
};

const handleTemplateApproved = async (template: TemplateEvent) => {
    console.log('🎉 Template approved:', {
        templateId: template.id,
        templateName: template.name,
        qualityScore: template.quality_score?.score
    });

    // TODO: Implement approved template logic
    // - Enable template for use
    // - Update template cache
    // - Notify template creators
};

const handleTemplateRejected = async (template: TemplateEvent) => {
    console.log('🚫 Template rejected:', {
        templateId: template.id,
        templateName: template.name,
        reason: template.rejected_reason
    });

    // TODO: Implement rejected template logic
    // - Disable template
    // - Notify template creators with feedback
    // - Log rejection reason for analysis
};

const handleTemplateDisabled = async (template: TemplateEvent) => {
    console.log('🔒 Template disabled:', {
        templateId: template.id,
        templateName: template.name
    });

    // TODO: Implement disabled template logic
    // - Remove from active templates
    // - Notify users of template unavailability
};

const handleTemplatePending = async (template: TemplateEvent) => {
    console.log('⏳ Template pending review:', {
        templateId: template.id,
        templateName: template.name
    });

    // TODO: Implement pending template logic
    // - Update status in database
    // - Notify reviewers
};

const handleTemplatePaused = async (template: TemplateEvent) => {
    console.log('⏸️ Template paused:', {
        templateId: template.id,
        templateName: template.name
    });

    // TODO: Implement paused template logic
    // - Temporarily disable template
    // - Notify administrators
};
