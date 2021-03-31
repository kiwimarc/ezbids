
exports.setIntendedFor = $root=>{
    overallIndex = 0

    function arrayRemove(arr, value) { 
        return arr.filter(function(ele){ 
            return ele != value; 
        });
    }

    $root.subjects.forEach(sub=>{

        // localizerIndices = []
        objectIndices = []
        objectIndicesOrig = []
        protocol = []
        sectionIndices = []

        // Determine how many sections there are per subject (and session)
        sectionIDs = []
        $root.objects.forEach(object=>{
            if (object._entities.subject == sub.subject) {
                if (!sectionIDs.includes(object.analysisResults.section_ID)) {
                    sectionIDs.push(object.analysisResults.section_ID)
                }
            }
        });
        
        for (section = 1; section <= sectionIDs.length; section++) {

            dwiIndices = []
            dwiPEDs = []
            fmapFuncIndices = []
            fmapDwiIndices = []
            fmapMagPhaseIndices = []
            fmapMagPhasediffIndices = []
            fmapFuncPEDs = []
            fmapDwiPEDs = []
            funcIndices = []
            funcPEDs = []
            // localizerIndices = []
            objectIndices = []
            objectIndicesOrig = []

            // Go through objects list and get values
            $root.objects.forEach(object=>{
                if (object._entities.subject == sub.subject) {
                    protocol.push(object._SeriesDescription)
                    objectIndices.push(object.idx - overallIndex)
                    objectIndicesOrig.push(object.idx)

                    if (object.analysisResults.section_ID == section) {
                        
                        // if (object.analysisResults.errors != null && object.analysisResults.errors[0].includes('localizer')) {
                        //     localizerIndices.push(object.idx - overallIndex)
                        // }
                        if (object._type == 'func/bold' && object._exclude == false) {
                            funcIndices.push(object.idx)
                            funcPEDs.push(object.items[0].sidecar.PhaseEncodingDirection)
                        }
                        if (object._type == 'dwi/dwi' && object._exclude == false) {
                            object.items.forEach(item=>{
                                if (item.name == 'json') {
                                    dwiIndices.push(object.idx)
                                    dwiPEDs.push(item.sidecar.PhaseEncodingDirection)
                                }
                            });
                        }

                        if (object._type.includes('fmap') && object._exclude == false) {
                            if (object._type.includes('mag') || object._type.includes('phasediff')) {
                                fmapMagPhasediffIndices.push(object.idx) }

                            else if (object._type.includes('mag') || object._type.includes('phase1') || object._type.includes('phase2')) {
                                fmapMagPhaseIndices.push(object.idx) }
                            else {
                                if (object.forType == 'func/bold') {
                                    fmapFuncIndices.push(object.idx)
                                    fmapFuncPEDs.push(object.items[0].sidecar.PhaseEncodingDirection) }
                                else {
                                    fmapDwiIndices.push(object.idx)
                                    fmapDwiPEDs.push(object.items[0].sidecar.PhaseEncodingDirection)
                                }
                            }
                        }
                    }
                }
            });

            if (funcIndices.length > 0) {
                // Remove spin-echo fmap if only 1 found in section
                if (fmapFuncIndices.length == 1) {
                    for (const i of fmapFuncIndices) {
                        $root.objects[i].exclude = true
                        $root_objects[i].errors = 'Only one spin echo field map found; need pair. This acquisition will not be included in the BIDS output'
                    }
                // Remove all spin-echo fmaps except for last two
                } else if (fmapFuncIndices.length > 2) {
                    bad = fmapFuncIndices.slice(0,-2)
                    for (const i of bad) {
                        $root.objects[i].exclude = true
                        $root_objects[i].errors = 'Multiple spin echo field map pairs detected in section; only selecting last pair for BIDS conversion. The other pair acquisition(s) in this section will not be included in the BIDS output'
                    }
                // Check that spin-echo pair has opposite PEDs
                } else if (fmapFuncIndices.length == 2) {
                    if (fmapFuncPEDs[0].toString().split('').reverse().join('').slice(-1) == fmapFuncPEDs[1].toString().split('').reverse().join('').slice(-1)) {
                        if ((fmapFuncPEDs[0].length == 2 && fmapFuncPEDs[1].length == 1) || (fmapFuncPEDs[0].length == 1 && fmapFuncPEDs[1].length == 2)) {
                            {}
                        } else {
                            $root_objects[i].exclude = true
                            $root_objects[i].errors = 'Spin echo field map pair do not have opposite phase encoding directions (PEDs) and will not be included in the BIDS output'
                        }
                    } else {
                        $root.objects[i].exclude = true
                        $root_objects[i].errors = 'Spin echo field map pair do not have opposite phase encoding directions (PEDs) and will not be included in the BIDS output'
                    }

                // Remove magnitudes & phasediff if less than 3
                } else if (fmapMagPhasediffIndices.length < 3) {
                    for (const i of fmapMagPhasediffIndices) {
                        $root.objects[i].exclude = true
                        $root.objects[i].errors = 'Need triplet for magnitude/phasediff field maps. This acquisition will not be included in the BIDS output'
                    }
                // Remove all magnitudes and phasediff except for last 3
                } else if (fmapMagPhasediffIndices.length > 3) {
                    bad = fmapMagPhasediffIndices.slice(0,-3)
                    for (const i of bad) {
                        $root.objects[i].exclude = true
                        $root.objects[i].errors = 'More than three magnitude/phasediff field map acquisitions found in section. Only selecting most recent three. Others will not be included in the BIDS output'
                    }
                // Remove magnitudes and phases if less than 4
                } else if (fmapMagPhaseIndices.length < 4) {
                    for (const i of fmapMagPhaseIndices) {
                        $root.objects[i].exclude = true
                        $root.objects[i].errors = 'Need four images (2 magnitude, 2 phase). This acquisition will not be included in the BIDS output'
                    }
                // Remove all magnitudes and phases except for last 4
                } else if (fmapMagPhaseIndices.length > 4) {
                    bad = fmapMagPhaseIndices.slice(0,-4)
                    for (const i of bad) {
                        $root.objects[i].exclude = true
                        $root.objects[i].errors = 'Multiple images sets of (2 magnitude, 2 phase) field map acquisitions found in section. Only selecting most recent set. Other(s) will not be included in the BIDS output'
                    }
                }
            } else {
                if (fmapFuncIndices.length > 0) {
                    for (const i of fmapFuncIndices) {
                        $root.objects[i].exclude = true
                        $root_objects[i].errors = 'No valid func/bold acquisitions found in section, spin echo field map pair will not be included in the BIDS output'
                    }
                } else if (fmapMagPhasediffIndices.length > 0) {
                    for (const i of fmapMagPhasediffIndices) {
                        $root.objects[i].exclude = true
                        $root.objects[i].errors = 'No valid func/bold acquisitions found in section, magnitude & phasediff field maps will not be included in the BIDS output'
                    }
                } else if (fmapMagPhaseIndices.length > 0) {
                    for (const i of fmapMagPhaseIndices) {
                        $root.objects[i].exclude = true
                        $root.objects[i].errors = 'No valid func/bold acquisitions found in section, magnitude & phase field maps will not be included in the BIDS output'
                    }
                }
            }

            if (dwiIndices.length == 0 && fmapDwiIndices.length > 0) {
                for (const i of fmapDwiIndices) {
                    $root.objects[i].exclude = true
                    $root.objects[i].errors = 'No valid dwi/dwi acquisitions found in section, field map will not be included in the BIDS output'
                }
            }

            // For spin-echo field maps, do not include func/bold (or dwi/dwi) acquisitions where the PEDs don't match
            intendedFor = funcIndices
            if (funcPEDs.length > 0 && fmapFuncPEDs.length > 0) {
                for (i = 0; i < funcIndices.length; i++) {
                    if (!fmapFuncPEDs.includes(funcPEDs[i])) {
                        intendedFor = arrayRemove(intendedFor, funcIndices[i])
                        $root.objects[funcIndices[i]].IntendedFor = intendedFor
                    }
                }
            }

            // Enter the IntendedFor fields for the fmaps
            for (const i of fmapFuncIndices) {
                $root.objects[i].IntendedFor = funcIndices
            }
            for (const i of fmapMagPhasediffIndices) {
                $root.objects[i].IntendedFor = funcIndices
            }
            for (const i of fmapMagPhaseIndices) {
                $root.objects[i].IntendedFor = funcIndices
            }
        }

        overallIndex = overallIndex + protocol.length

    });
}
