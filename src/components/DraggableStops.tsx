'use client'

import { useEffect, useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Trash2, Calendar, Clock, Plus, GripVertical } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Activity {
  id: string
  name: string
  description?: string
  startTime?: string
  cost?: number
}

interface Stop {
  id: string
  order: number
  startDate: string
  endDate: string
  city: {
    id: string
    name: string
    country: string
  }
  activities: Activity[]
}

interface DraggableStopsProps {
  stops: Stop[]
  onDragEnd: (result: DropResult) => void
  onEditStop: (stop: Stop) => void
  onDeleteStop: (stopId: string) => void
  onAddActivity: (stop: Stop) => void
  onDeleteActivity: (stopId: string, activityId: string) => void
  isDeleting: boolean
}

export default function DraggableStops({
  stops,
  onDragEnd,
  onEditStop,
  onDeleteStop,
  onAddActivity,
  onDeleteActivity,
  isDeleting
}: DraggableStopsProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a loading state that matches the final structure
    return (
      <div className="space-y-6">
        {stops.sort((a, b) => a.order - b.order).map((stop, index) => (
          <Card key={stop.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                  </div>
                  <CardTitle className="flex items-center space-x-2">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    <span>{stop.city.name}</span>
                  </CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEditStop(stop)}
                    disabled={isDeleting}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onDeleteStop(stop.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {stop.city.country && stop.city.country !== 'Unknown' && (
                <CardDescription className="ml-7">{stop.city.country}</CardDescription>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-600 ml-7">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(new Date(stop.startDate))} - {formatDate(new Date(stop.endDate))}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{Math.ceil((new Date(stop.endDate).getTime() - new Date(stop.startDate).getTime()) / (1000 * 60 * 60 * 24))} days</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Todo</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onAddActivity(stop)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Todo
                  </Button>
                </div>
                
                {stop.activities.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-sm">No todo items planned for this stop.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stop.activities.map((activity) => (
                      <div key={activity.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{activity.name}</h5>
                          <div className="flex items-center space-x-2">
                            {activity.cost && (
                              <span className="text-sm text-gray-600">
                                {formatCurrency(activity.cost)}
                              </span>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => onDeleteActivity(stop.id, activity.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-gray-700 mb-2">{activity.description}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {activity.startTime ? formatDate(new Date(activity.startTime)) : 'No date set'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="stops">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-6"
          >
            {stops
              .sort((a, b) => a.order - b.order)
              .map((stop, index) => (
              <Draggable key={stop.id} draggableId={stop.id} index={index}>
                {(provided, snapshot) => (
                  <Card
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`transition-shadow ${
                      snapshot.isDragging ? 'shadow-lg' : ''
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
                          >
                            <GripVertical className="h-4 w-4 text-gray-400" />
                          </div>
                          <CardTitle className="flex items-center space-x-2">
                            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                              {index + 1}
                            </span>
                            <span>{stop.city.name}</span>
                          </CardTitle>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onEditStop(stop)}
                            disabled={isDeleting}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onDeleteStop(stop.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {stop.city.country && stop.city.country !== 'Unknown' && (
                        <CardDescription className="ml-7">{stop.city.country}</CardDescription>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-600 ml-7">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(new Date(stop.startDate))} - {formatDate(new Date(stop.endDate))}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{Math.ceil((new Date(stop.endDate).getTime() - new Date(stop.startDate).getTime()) / (1000 * 60 * 60 * 24))} days</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">Todo</h4>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onAddActivity(stop)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Todo
                          </Button>
                        </div>
                        
                        {stop.activities.length === 0 ? (
                          <div className="text-center py-6 bg-gray-50 rounded-lg">
                            <p className="text-gray-600 text-sm">No todo items planned for this stop.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {stop.activities.map((activity) => (
                              <div key={activity.id} className="border rounded-lg p-4 bg-white">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-medium text-gray-900">{activity.name}</h5>
                                  <div className="flex items-center space-x-2">
                                    {activity.cost && (
                                      <span className="text-sm text-gray-600">
                                        {formatCurrency(activity.cost)}
                                      </span>
                                    )}
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => onDeleteActivity(stop.id, activity.id)}
                                      disabled={isDeleting}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                {activity.description && (
                                  <p className="text-sm text-gray-700 mb-2">{activity.description}</p>
                                )}
                                <p className="text-xs text-gray-500">
                                  <Calendar className="h-3 w-3 inline mr-1" />
                                  {activity.startTime ? formatDate(new Date(activity.startTime)) : 'No date set'}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
