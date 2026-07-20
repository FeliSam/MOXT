export function parcelRequestToRemoteRow(request) {
  return {
    id: request.id,
    parcel_id: request.parcelId,
    user_id: request.userId,
    requester_name: request.requesterName || '',
    owner_id: request.ownerId,
    business_id: request.businessId || null,
    related_type: request.relatedType || 'parcel',
    related_id: request.relatedId || request.parcelId || '',
    kg: Number(request.kg) || 0,
    status: request.status || 'submitted',
    created_at: request.createdAt,
    updated_at: request.updatedAt || request.createdAt,
  }
}

export function eventRegistrationToRemoteRow(registration) {
  return {
    id: registration.id,
    event_id: registration.eventId,
    user_id: registration.userId,
    participant_name: registration.participantName || '',
    status: registration.status || 'registered',
    created_at: registration.createdAt,
    updated_at: registration.updatedAt || registration.createdAt,
  }
}
